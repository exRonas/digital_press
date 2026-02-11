<?php

namespace App\Http\Controllers;

use App\Models\Issue;
use App\Models\Publication;
use App\Models\File;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;
use App\Jobs\ProcessOcrJob; 

class IssueController extends Controller
{
    // Public Catalog
    public function index(Request $request)
    {
        $query = Issue::with(['publication', 'ocrResult' => function($q) {
            $q->select('issue_id', 'status'); // Don't load full text
        }]);

        // Filters
        if ($request->has('publication_id')) {
            $query->where('publication_id', $request->publication_id);
        }

        if ($request->has('date_from')) {
            $query->where('issue_date', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->where('issue_date', '<=', $request->date_to);
        }
        
        // Add specific Year/Month filtering
        if ($request->has('year')) {
            $query->whereYear('issue_date', $request->year);
        }

        if ($request->has('month')) {
            $query->whereMonth('issue_date', $request->month);
        }

        if ($request->has('issue_number')) {
            $query->where('issue_number', 'like', '%' . $request->issue_number . '%');
        }

        if ($request->has('language')) {
            $query->where('language', $request->language);
        }

        // Full Text Search
        if ($request->has('search') && $request->filled('search')) {
            $searchTerm = $request->search;
            
            $query->where(function($q) use ($searchTerm) {
                // 1. Search by Issue Number
                $q->where('issue_number', 'like', '%' . $searchTerm . '%');

                // 2. Search by Date (Year) if input is 4 digits
                if (preg_match('/^\d{4}$/', $searchTerm)) {
                    $q->orWhereYear('issue_date', $searchTerm);
                }

                // 3. Search in OCR Content
                $q->orWhereHas('ocrResult', function($ocrQ) use ($searchTerm) {
                    if (DB::connection()->getDriverName() === 'pgsql') {
                        $ocrQ->whereRaw("search_vector @@ plainto_tsquery('russian', ?)", [$searchTerm]);
                    } else {
                        $ocrQ->where('full_text', 'like', '%' . $searchTerm . '%');
                    }
                });
            });
        }
        
        // Sorting
        $sort = $request->input('sort', 'date_desc');
        switch ($sort) {
            case 'date_asc':
                $query->orderBy('issue_date', 'asc');
                break;
            case 'date_desc':
            default:
                $query->orderBy('issue_date', 'desc');
                break;
        }

        return $query->paginate(20);
    }

    /**
     * Admin: Get all issues with stats for management
     */
    public function adminIndex(Request $request)
    {
        $query = Issue::with(['publication', 'stats']);

        if ($request->has('search') && $request->filled('search')) {
            $search = $request->search;
            $query->whereHas('publication', function($q) use ($search) {
                $q->where('title_ru', 'like', "%{$search}%")
                  ->orWhere('title_kz', 'like', "%{$search}%");
            })->orWhere('issue_number', 'like', "%{$search}%");
        }

        if ($request->has('language') && $request->language !== 'all') {
            $query->where('language', $request->language);
        }

        if ($request->has('publication_id') && $request->publication_id !== 'all') {
            $query->where('publication_id', $request->publication_id);
        }

        $issues = $query->orderBy('issue_date', 'desc')->paginate(20);

        return response()->json($issues);
    }

    public function years()
    {
        $driver = DB::connection()->getDriverName();
        
        $expression = match ($driver) {
            'sqlite' => "strftime('%Y', issue_date)",
            'pgsql' => 'EXTRACT(YEAR FROM issue_date)',
            'mysql' => 'YEAR(issue_date)',
            default => 'YEAR(issue_date)',
        };

        $years = Issue::selectRaw("$expression as year")
            ->distinct()
            ->orderBy('year', 'desc')
            ->pluck('year');
            
        return response()->json($years);
    }

    public function show(Request $request, $id)
    {
        $issue = Issue::with('publication', 'stats')->findOrFail($id);
        
        // Prevent duplicate view counts within a session
        $sessionKey = 'viewed_issue_' . $id;

        if (!$request->session()->has($sessionKey)) {
            $issue->stats()->increment('views_count', 1, ['last_viewed_at' => now()]);
            $request->session()->put($sessionKey, true);
        }

        return response()->json($issue);
    }

    public function download($id)
    {
        $issue = Issue::with('file')->findOrFail($id);
        
        // Use new File system if available
        if ($issue->file) {
            $issue->stats()->increment('downloads_count', 1, ['last_downloaded_at' => now()]);
            
            // Check if running behind Nginx (X-Accel-Redirect support)
            if ($this->isNginx()) {
                return response('', 200, [
                    'X-Accel-Redirect' => $issue->file->getAccelRedirectPath(),
                    'Content-Type' => $issue->file->mime_type,
                    'Content-Disposition' => 'attachment; filename="' . rawurlencode($issue->file->original_name) . '"',
                    'Content-Length' => $issue->file->size,
                    'Cache-Control' => 'private, no-store',
                ]);
            }
            
            // Fallback for development (php artisan serve) - stream file directly
            return response()->file(
                $issue->file->getFullDiskPath(),
                [
                    'Content-Type' => $issue->file->mime_type,
                    'Content-Disposition' => 'attachment; filename="' . rawurlencode($issue->file->original_name) . '"',
                ]
            );
        }
        
        // Legacy fallback - direct Laravel file serving
        if (!Storage::exists($issue->file_path)) {
            return response()->json(['message' => 'File not found on disk'], 404);
        }

        $issue->stats()->increment('downloads_count', 1, ['last_downloaded_at' => now()]);
        
        return Storage::download($issue->file_path, "issue_{$issue->id}.pdf");
    }

    public function view(Request $request, $id)
    {
        $issue = Issue::with('file')->findOrFail($id);
        
        // NEW: Use File system with X-Accel-Redirect
        if ($issue->file) {
            if (!$issue->file->existsOnDisk()) {
                \Log::error("File not found on disk", ['file_id' => $issue->file->id, 'path' => $issue->file->stored_path]);
                return response()->json(['message' => 'File not found on disk'], 404);
            }
            
            // Check if running behind Nginx (X-Accel-Redirect support)
            // Or force it via config/env if detection fails
            if (false) {
                return response('', 200, [
                    'X-Accel-Redirect' => $issue->file->getAccelRedirectPath(),
                    'Content-Type' => $issue->file->mime_type,
                    'Content-Disposition' => 'inline; filename="' . rawurlencode($issue->file->original_name) . '"',
                    'Content-Length' => $issue->file->size,
                    'Accept-Ranges' => 'bytes',
                    'Cache-Control' => 'private, no-store, no-cache, must-revalidate',
                    'Pragma' => 'no-cache',
                ]);
            }
            
            // Fallback for development (php artisan serve) - stream file directly
            // WARNING: This will block the single-threaded PHP server for large files!
            return response()->file(
                $issue->file->getFullDiskPath(),
                [
                    'Content-Type' => $issue->file->mime_type,
                    'Content-Disposition' => 'inline; filename="' . rawurlencode($issue->file->original_name) . '"',
                    'Accept-Ranges' => 'bytes',
                ]
            );
        }
        
        // Legacy fallback - return URL for old files
        if (!Storage::disk('public')->exists($issue->file_path)) {
             \Log::error("File not found: {$issue->file_path}");
            return response()->json(['message' => 'File not found on disk'], 404);
        }

        // Legacy fallback - serve via X-Accel-Redirect from public storage
        // physical path: storage/app/public/{$issue->file_path}
        // Nginx location /_protected/ alias storage/app/
        $accelPath = '/_protected/public/' . $issue->file_path;
        
        $physicalPath = storage_path('app/public/' . $issue->file_path);
        \Log::channel('single')->info("PDF Debug: Preparing to serve file", [
            'issue_id' => $id,
            'db_path' => $issue->file_path,
            'accel_path' => $accelPath,
            'physical_path_check' => $physicalPath,
            'exists' => file_exists($physicalPath) ? 'YES' : 'NO',
            'file_size' => file_exists($physicalPath) ? filesize($physicalPath) : 0
        ]);

        return response('', 200, [
            'X-Accel-Redirect' => $accelPath,
            'X-Accel-Buffering' => 'no',
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="issue_' . $issue->id . '.pdf"',
            'Content-Length' => file_exists($physicalPath) ? filesize($physicalPath) : 0,
            'Accept-Ranges' => 'bytes',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
        ]);
    }

    // Admin / Operator Methods

    public function store(Request $request)
    {
        \Log::info('Regular Upload: Start', $request->only(['publication_id', 'issue_date', 'issue_number', 'language']));

        $request->validate([
            'publication_id' => 'required|exists:publications,id',
            'issue_date' => 'required|date',
            'issue_number' => 'required|string',
            'language' => 'required|in:ru,kz,other',
            'file' => 'required|file|mimes:pdf|max:512000', // 500MB max
        ]);

        $uploadedFile = $request->file('file');
        
        // Generate unique filename
        $uuid = Str::uuid();
        
        // 1. Save Original File
        // Using config path for originals: storage/app/pdf/original
        $originalPathReq = Config::get('pdf.paths.original', 'pdf/original');
        $extension = $uploadedFile->getClientOriginalExtension() ?: 'pdf';
        
        // Ensure directory exists
        if (!Storage::exists($originalPathReq)) {
            Storage::makeDirectory($originalPathReq);
        }

        $originalStoredPath = $uploadedFile->storeAs($originalPathReq, "{$uuid}.{$extension}");

        // Calculate initial stats
        $fullOriginalPath = Storage::path($originalStoredPath);
        $sha256 = hash_file('sha256', $fullOriginalPath);
        $size = filesize($fullOriginalPath);

        DB::beginTransaction();
        try {
            // Create File record
            // Initial status is 'uploaded'
            // 'stored_path' points to original initially, but will be updated by CompressPdfJob
            // 'original_path' keeps the reference to source
            $file = File::create([
                'original_name' => $uploadedFile->getClientOriginalName(),
                'stored_path' => $originalStoredPath, // Initially point to original
                'original_path' => $originalStoredPath,
                'status' => 'uploaded',
                'mime_type' => 'application/pdf', // Enforced by validation
                'size' => $size,
                'sha256' => $sha256,
                'uploaded_by' => $request->user()->id,
            ]);

            // Create Issue with file relation
            $issue = Issue::create([
                'publication_id' => $request->publication_id,
                'issue_date' => $request->issue_date,
                'issue_number' => $request->issue_number,
                'language' => $request->language,
                'file_path' => $file->stored_path, // Keep for legacy compatibility
                'file_id' => $file->id,     // New file relation
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
            
            DB::commit();

            // Dispatch Compression Job
            \App\Jobs\CompressPdfJob::dispatch($file); 

            return response()->json([
                'message' => 'Issue created successfully. Processing started (Compression -> OCR).',
                'id' => $issue->id
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            // Cleanup file if DB failed
            Storage::delete($originalStoredPath);
            \Log::error('Issue create failed: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to create issue: ' . $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $issue = Issue::findOrFail($id);
        
        $request->validate([
            'publication_id' => 'exists:publications,id',
            'issue_date' => 'date',
            'issue_number' => 'string',
            'language' => 'in:ru,kz,other',
        ]);

        $issue->update($request->only(['publication_id', 'issue_date', 'issue_number', 'language']));

        return response()->json($issue);
    }

    public function destroy($id)
    {
        $issue = Issue::findOrFail($id);
        
        // Delete file
        if (Storage::exists($issue->file_path)) {
            Storage::delete($issue->file_path);
        }

        $issue->delete(); // Cascades to ocrResults and stats because of DB foreign keys
        
        return response()->json(['message' => 'Deleted']);
    }

    public function retryOcr($id)
    {
        $issue = Issue::findOrFail($id);
        ProcessOcrJob::dispatch($issue);
        return response()->json(['message' => 'OCR Retry Queued']);
    }

    /**
     * Check if running behind Nginx (for X-Accel-Redirect support)
     */
    private function isNginx(): bool
    {
        $server = request()->server('SERVER_SOFTWARE', '');
        return stripos($server, 'nginx') !== false;
    }
}
