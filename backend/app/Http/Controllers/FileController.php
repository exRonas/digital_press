<?php

namespace App\Http\Controllers;

use App\Models\File;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class FileController extends Controller
{
    /**
     * List files (with optional filtering)
     */
    public function index(Request $request): JsonResponse
    {
        $query = File::query();

        if ($request->has('issue_id')) {
            $query->where('issue_id', $request->issue_id);
        }

        if ($request->has('mime_type')) {
            $query->where('mime_type', $request->mime_type);
        }

        $files = $query->paginate(20);

        return response()->json($files);
    }

    /**
     * Get file metadata
     */
    public function show(File $file): JsonResponse
    {
        // Authorization check
        Gate::authorize('view', $file);

        return response()->json([
            'id' => $file->id,
            'original_name' => $file->original_name,
            'mime_type' => $file->mime_type,
            'size' => $file->size,
            'formatted_size' => $file->formatted_size,
            'created_at' => $file->created_at,
        ]);
    }

    /**
     * Upload a new file
     */
    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', File::class);

        $request->validate([
            'file' => 'required|file|mimes:pdf|max:512000', // 500MB max
            'issue_id' => 'nullable|exists:issues,id',
        ]);

        $uploadedFile = $request->file('file');
        $uuid = Str::uuid();
        $extension = $uploadedFile->getClientOriginalExtension() ?: 'pdf';
        $storedPath = "private/pdfs/{$uuid}.{$extension}";

        // Ensure directory exists
        $directory = storage_path('app/private/pdfs');
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        // Move file to private storage
        $uploadedFile->storeAs('private/pdfs', "{$uuid}.{$extension}");

        // Calculate SHA256
        $fullPath = storage_path("app/{$storedPath}");
        $sha256 = hash_file('sha256', $fullPath);

        // Create database record
        $file = File::create([
            'original_name' => $uploadedFile->getClientOriginalName(),
            'stored_path' => $storedPath,
            'mime_type' => $uploadedFile->getMimeType() ?? 'application/pdf',
            'size' => $uploadedFile->getSize(),
            'sha256' => $sha256,
            'issue_id' => $request->issue_id,
            'uploaded_by' => $request->user()->id,
        ]);

        Log::info('File uploaded', [
            'file_id' => $file->id,
            'original_name' => $file->original_name,
            'size' => $file->size,
            'user_id' => $request->user()->id,
        ]);

        return response()->json([
            'id' => $file->id,
            'original_name' => $file->original_name,
            'size' => $file->size,
            'formatted_size' => $file->formatted_size,
        ], 201);
    }

    /**
     * Open file for viewing (X-Accel-Redirect for Nginx)
     * 
     * This is the KEY method:
     * - Laravel checks authorization
     * - Laravel does NOT read/stream the file
     * - Nginx intercepts X-Accel-Redirect and serves the file directly
     * - Nginx handles Range requests automatically (206 Partial Content)
     */
    public function open(File $file): Response
    {
        // Authorization check
        Gate::authorize('view', $file);

        // Verify file exists
        if (!$file->existsOnDisk()) {
            Log::error('File not found on disk', [
                'file_id' => $file->id,
                'stored_path' => $file->stored_path,
            ]);
            abort(404, 'File not found');
        }

        // Log access (optional)
        Log::info('File accessed', [
            'file_id' => $file->id,
            'user_id' => auth()->id(),
            'ip' => request()->ip(),
        ]);

        // Return X-Accel-Redirect response
        // Nginx will intercept this header and serve the file directly
        return response('', 200, [
            'X-Accel-Redirect' => $file->getAccelRedirectPath(),
            'Content-Type' => $file->mime_type,
            'Content-Disposition' => 'inline; filename="' . rawurlencode($file->original_name) . '"',
            'Content-Length' => $file->size,
            'Accept-Ranges' => 'bytes',
            // Security headers - prevent caching of private files
            'Cache-Control' => 'private, no-store, no-cache, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }

    /**
     * Download file (X-Accel-Redirect with attachment disposition)
     */
    public function download(File $file): Response
    {
        Gate::authorize('download', $file);

        if (!$file->existsOnDisk()) {
            abort(404, 'File not found');
        }

        // Log download
        Log::info('File downloaded', [
            'file_id' => $file->id,
            'user_id' => auth()->id(),
        ]);

        return response('', 200, [
            'X-Accel-Redirect' => $file->getAccelRedirectPath(),
            'Content-Type' => $file->mime_type,
            'Content-Disposition' => 'attachment; filename="' . rawurlencode($file->original_name) . '"',
            'Content-Length' => $file->size,
            'Cache-Control' => 'private, no-store',
        ]);
    }

    /**
     * Delete file
     */
    public function destroy(File $file): JsonResponse
    {
        Gate::authorize('delete', $file);

        $path = $file->getFullDiskPath();
        
        // Delete from database first
        $file->delete();

        // Delete from disk
        if (file_exists($path)) {
            unlink($path);
        }

        Log::info('File deleted', [
            'file_id' => $file->id,
            'user_id' => auth()->id(),
        ]);

        return response()->json(['message' => 'File deleted']);
    }

    /**
     * Get file URL (alternative approach with signed URLs)
     * Returns a URL that can be used directly by the frontend
     */
    public function url(File $file): JsonResponse
    {
        Gate::authorize('view', $file);

        if (!$file->existsOnDisk()) {
            abort(404, 'File not found');
        }

        // Return the API open URL - frontend will use this
        // The actual file serving happens via X-Accel-Redirect when this URL is accessed
        $url = url("/api/files/{$file->id}/open");

        return response()->json([
            'url' => $url,
            'filename' => $file->original_name,
            'size' => $file->size,
            'mime_type' => $file->mime_type,
        ]);
    }
}
