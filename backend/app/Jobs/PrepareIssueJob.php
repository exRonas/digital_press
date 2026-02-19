<?php

namespace App\Jobs;

use App\Models\Issue;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;

/**
 * PrepareIssueJob — runs on the DEFAULT queue (fast).
 * Compresses the PDF and generates a thumbnail.
 * At the end, dispatches ProcessOcrJob on the OCR queue (slow).
 *
 * This separation allows auto_import to run only this job
 * (queue:work --queue=default) while OCR is processed
 * in the background by the persistent start_worker.
 */
class PrepareIssueJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public Issue $issue;

    public function __construct(Issue $issue)
    {
        $this->issue = $issue;
        $this->onQueue('default');
    }

    public function handle(): void
    {
        $issue = $this->issue->fresh(); // Reload from DB
        Log::info("[PrepareIssueJob] Starting for issue #{$issue->id}");

        $pdfPath = Storage::disk('public')->path($issue->file_path);

        if (!file_exists($pdfPath)) {
            Log::error("[PrepareIssueJob] PDF not found: {$pdfPath}");
            return;
        }

        // 1. Generate thumbnail (fast — only first page, low DPI)
        $this->generateThumbnail($pdfPath, $issue);

        // 2. Compress PDF with Ghostscript
        $this->compressPdf($pdfPath, $issue);

        // 3. Queue OCR job on separate 'ocr' queue
        ProcessOcrJob::dispatch($issue)->onQueue('ocr');
        Log::info("[PrepareIssueJob] OCR job dispatched to 'ocr' queue for issue #{$issue->id}");
    }

    private function generateThumbnail(string $pdfPath, Issue $issue): void
    {
        try {
            $thumbnailDir      = 'thumbnails';
            $thumbnailFilename = 'issue_' . $issue->id . '.jpg';
            $thumbnailPath     = $thumbnailDir . '/' . $thumbnailFilename;

            Storage::disk('public')->makeDirectory($thumbnailDir);
            $absoluteThumbnailPath = Storage::disk('public')->path($thumbnailPath);

            $popplerPath  = env('POPPLER_PATH', 'C:\\poppler\\bin');
            $pdftoppmCmd  = "{$popplerPath}/pdftoppm.exe";
            $tempThumbPath = storage_path('app/temp/thumb_' . $issue->id);

            $process = new Process([
                $pdftoppmCmd,
                '-jpeg',
                '-r', '72',
                '-f', '1',
                '-l', '1',
                '-singlefile',
                $pdfPath,
                $tempThumbPath,
            ]);
            $process->setTimeout(60);
            $process->run();

            $generatedFile = $tempThumbPath . '.jpg';

            if ($process->isSuccessful() && file_exists($generatedFile)) {
                rename($generatedFile, $absoluteThumbnailPath);
                $issue->update(['thumbnail_path' => $thumbnailPath]);
                Log::info("[PrepareIssueJob] Thumbnail generated: {$thumbnailPath}");
            } else {
                Log::warning("[PrepareIssueJob] Thumbnail failed for issue #{$issue->id}: " . $process->getErrorOutput());
                // Clean up temp file if exists
                if (file_exists($generatedFile)) {
                    @unlink($generatedFile);
                }
            }
        } catch (\Throwable $e) {
            Log::warning("[PrepareIssueJob] Thumbnail exception for issue #{$issue->id}: " . $e->getMessage());
        }
    }

    private function compressPdf(string $pdfPath, Issue $issue): void
    {
        try {
            if (!config('pdf.compression.enabled', true)) {
                Log::info("[PrepareIssueJob] PDF compression disabled, skipping.");
                return;
            }

            $gsPath   = config('pdf.compression.ghostscript_path', 'gs');
            $profile  = config('pdf.compression.profile', 'ebook');
            $timeout  = config('pdf.compression.timeout', 300);
            $gray     = config('pdf.compression.grayscale', false);

            $tempOutput = $pdfPath . '.compressed.pdf';

            $command = [
                $gsPath,
                '-sDEVICE=pdfwrite',
                '-dCompatibilityLevel=1.4',
                "-dPDFSETTINGS=/{$profile}",
                '-dNOPAUSE',
                '-dQUIET',
                '-dBATCH',
                "-sOutputFile={$tempOutput}",
            ];

            if ($gray) {
                $command[] = '-sColorConversionStrategy=Gray';
                $command[] = '-dProcessColorModel=/DeviceGray';
            }

            $command[] = $pdfPath;

            $originalSize = filesize($pdfPath);

            $process = new Process($command);
            $process->setTimeout($timeout);
            $process->run();

            if (!$process->isSuccessful() || !file_exists($tempOutput) || filesize($tempOutput) === 0) {
                Log::warning("[PrepareIssueJob] Ghostscript failed or empty output, keeping original.");
                if (file_exists($tempOutput)) @unlink($tempOutput);
                return;
            }

            $newSize = filesize($tempOutput);

            if ($newSize < $originalSize) {
                rename($tempOutput, $pdfPath);
                $issue->update(['file_size' => $newSize]);
                $saved = round(($originalSize - $newSize) / 1024 / 1024, 2);
                Log::info("[PrepareIssueJob] Compressed: {$originalSize} -> {$newSize} bytes (saved {$saved} MB)");
            } else {
                Log::info("[PrepareIssueJob] Compressed file not smaller, keeping original.");
                @unlink($tempOutput);
            }
        } catch (\Throwable $e) {
            Log::warning("[PrepareIssueJob] Compression exception (non-critical): " . $e->getMessage());
        }
    }
}
