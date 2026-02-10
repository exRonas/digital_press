<?php

namespace App\Http\Controllers;

use App\Models\Issue;
use App\Models\File;
use App\Jobs\CompressPdfJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Config;

class ChunkedUploadController extends Controller
{
    /**
     * Initialize a chunked upload session.
     * Returns an upload_id to be used for subsequent chunk uploads.
     */
    public function init(Request $request)
    {
        \Log::info('Chunked Upload: Init', $request->all());
        $request->validate([
            'filename' => 'required|string',
            'filesize' => 'required|integer',
        ]);

        $chunkSize = 1024 * 1024; // 1MB to avoid PHP upload limits on dev server
        $totalChunks = (int) ceil($request->filesize / $chunkSize);

        $uploadId = Str::uuid()->toString();
        
        // Create temp directory for this upload
        $tempDir = "uploads/temp/{$uploadId}";
        Storage::makeDirectory($tempDir);
        
        // Store upload metadata in cache/session (or DB for persistence)
        cache()->put("upload_{$uploadId}", [
            'filename' => $request->filename,
            'filesize' => $request->filesize,
            'total_chunks' => $totalChunks,
            'received_chunks' => [],
            'created_at' => now(),
            'user_id' => $request->user()->id,
        ], now()->addHours(24)); // Expire after 24 hours

        return response()->json([
            'upload_id' => $uploadId,
            'chunk_size' => $chunkSize,
            'total_chunks' => $totalChunks,
        ]);
    }

    /**
     * Receive a single chunk of the file.
     */
    public function chunk(Request $request)
    {
        // Don't log full request to avoid spamming logs with binary data, just log index
        \Log::info('Chunked Upload: Chunk received', [
            'upload_id' => $request->upload_id, 
            'index' => $request->chunk_index
        ]);

        $request->validate([
            'upload_id' => 'required|string',
            'chunk_index' => 'required|integer|min:0',
            'chunk' => 'required|file',
        ]);

        $uploadId = $request->upload_id;
        $chunkIndex = $request->chunk_index;
        
        // Get upload metadata
        $metadata = cache()->get("upload_{$uploadId}");
        
        if (!$metadata) {
            return response()->json(['message' => 'Upload session not found or expired'], 404);
        }

        // Save chunk to temp directory
        $tempDir = "uploads/temp/{$uploadId}";
        $chunkPath = "{$tempDir}/chunk_{$chunkIndex}";
        
        $request->file('chunk')->storeAs('', $chunkPath);
        
        // Update received chunks list
        $metadata['received_chunks'][] = $chunkIndex;
        $metadata['received_chunks'] = array_unique($metadata['received_chunks']);
        sort($metadata['received_chunks']);
        cache()->put("upload_{$uploadId}", $metadata, now()->addHours(24));

        $receivedCount = count($metadata['received_chunks']);
        $totalChunks = $metadata['total_chunks'];

        return response()->json([
            'message' => 'Chunk received',
            'chunk_index' => $chunkIndex,
            'received' => $receivedCount,
            'total' => $totalChunks,
            'progress' => round(($receivedCount / $totalChunks) * 100, 1),
        ]);
    }
    /**
     * Complete the upload: merge chunks and create the Issue.
     */
    public function complete(Request $request)
    {
        \Log::info('Chunked Upload: Complete', $request->except(['upload_id'])); // Log metadata
        $request->validate([
            'upload_id' => 'required|string',
            'publication_id' => 'required|exists:publications,id',
            'issue_date' => 'required|date',
            'issue_number' => 'required|string',
            'language' => 'required|in:ru,kz,other',
        ]);

        $uploadId = $request->upload_id;
        $metadata = cache()->get("upload_{$uploadId}");

        if (!$metadata) {
            return response()->json(['message' => 'Upload session not found or expired'], 404);
        }

        // Verify all chunks received
        $receivedChunks = $metadata['received_chunks'];
        $totalChunks = $metadata['total_chunks'];
        
        if (count($receivedChunks) !== $totalChunks) {
            return response()->json([
                'message' => 'Not all chunks received',
                'received' => count($receivedChunks),
                'expected' => $totalChunks,
            ], 400);
        }

        $tempDir = "uploads/temp/{$uploadId}";
        
        // Determine final path using NEW structure
        $originalPathReq = Config::get('pdf.paths.original', 'pdf/original');
        
        // Ensure directory exists
        if (!Storage::exists($originalPathReq)) {
            Storage::makeDirectory($originalPathReq);
        }

        $uuid = Str::uuid();
        $extension = 'pdf'; 
        if (isset($metadata['filename'])) {
            $ext = pathinfo($metadata['filename'], PATHINFO_EXTENSION);
            if ($ext) $extension = $ext;
        }

        $originalStoredPath = $originalPathReq . '/' . $uuid . '.' . $extension;
        
        DB::beginTransaction();
        try {
            // Merge chunks into final file
            $finalFullPath = Storage::path($originalStoredPath);
            
            $outputFile = fopen($finalFullPath, 'wb');
            
            for ($i = 0; $i < $totalChunks; $i++) {
                $chunkPath = Storage::path("{$tempDir}/chunk_{$i}");
                $chunkData = file_get_contents($chunkPath);
                fwrite($outputFile, $chunkData);
            }
            
            fclose($outputFile);

            // Calculate stats
            $sha256 = hash_file('sha256', $finalFullPath);
            $size = filesize($finalFullPath);
            
            // Create File record
            $file = File::create([
                'original_name' => $metadata['filename'] ?? "upload_{$uploadId}.pdf",
                'stored_path' => $originalStoredPath,
                'original_path' => $originalStoredPath,
                'status' => 'uploaded',
                'mime_type' => 'application/pdf',
                'size' => $size,
                'sha256' => $sha256,
                'uploaded_by' => $request->user()->id,
            ]);
            
            // Create Issue record
            $issue = Issue::create([
                'publication_id' => $request->publication_id,
                'issue_date' => $request->issue_date,
                'issue_number' => $request->issue_number,
                'language' => $request->language,
                'file_path' => $file->stored_path, // Legacy
                'file_id' => $file->id,
                'file_size' => $file->size,
                'mime_type' => $file->mime_type,
                'created_by' => $request->user()->id,
            ]);

            // Link file to issue
            $file->update(['issue_id' => $issue->id]);

            // Init stats
            $issue->stats()->create([]);
            
            // Init OCR status
            $issue->ocrResult()->create(['status' => 'queued']);
            
            // Dispatch Compression Job
            CompressPdfJob::dispatch($file);

            // Cleanup temp directory
            Storage::deleteDirectory($tempDir);
            cache()->forget("upload_{$uploadId}");

            DB::commit();
            
            return response()->json([
                'message' => 'Upload complete. Processing started (Compression -> OCR).',
                'issue' => $issue,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            // Cleanup on failure
            Storage::deleteDirectory($tempDir);
            if (isset($originalStoredPath) && Storage::exists($originalStoredPath)) {
                Storage::delete($originalStoredPath);
            }
            cache()->forget("upload_{$uploadId}");
            \Log::error('Chunked Upload Failed: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            
            return response()->json(['message' => 'Upload failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Cancel/abort an upload session.
     */
    public function abort(Request $request)
    {
        $request->validate([
            'upload_id' => 'required|string',
        ]);

        $uploadId = $request->upload_id;
        
        // Cleanup
        $tempDir = "uploads/temp/{$uploadId}";
        Storage::deleteDirectory($tempDir);
        cache()->forget("upload_{$uploadId}");

        return response()->json(['message' => 'Upload cancelled']);
    }
}
