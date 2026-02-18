<?php

namespace App\Jobs;

use App\Models\Issue;
use App\Models\OcrResult;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

class ProcessOcrJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $issue;

    public function __construct(Issue $issue)
    {
        $this->issue = $issue;
    }

    public function handle(): void
    {
        Log::info("[OCR] Starting OCR for issue #{$this->issue->id}");
        
        $ocrResult = $this->issue->ocrResult;
        if (!$ocrResult) {
            $ocrResult = $this->issue->ocrResult()->create(['status' => 'queued']);
            Log::info("[OCR] Created new OcrResult record");
        }

        $ocrResult->update([
            'status' => 'processing',
            'started_at' => now(),
            'error_message' => null,
        ]);

        $tempDir = storage_path('app/temp/ocr_' . $this->issue->id);
        if (!file_exists($tempDir)) {
            mkdir($tempDir, 0755, true);
        }
        Log::info("[OCR] Temp dir: {$tempDir}");

        try {
            // Files are stored in 'public' disk (storage/app/public/)
            $pdfPath = Storage::disk('public')->path($this->issue->file_path);
            Log::info("[OCR] PDF path: {$pdfPath}");
            Log::info("[OCR] File exists: " . (file_exists($pdfPath) ? 'YES' : 'NO'));
            
            if (!file_exists($pdfPath)) {
                throw new \Exception("PDF file not found: {$pdfPath}");
            }
            
            $fullText = "";

            // 1. Convert PDF to PNGs using Poppler (pdftoppm)
            $popplerPath = env('POPPLER_PATH', 'C:\\poppler\\bin');
            $pdftoppmCmd = "{$popplerPath}/pdftoppm.exe";
            
            Log::info("[OCR] Poppler path: {$popplerPath}");
            Log::info("[OCR] pdftoppm command: {$pdftoppmCmd}");
            Log::info("[OCR] pdftoppm exists: " . (file_exists($pdftoppmCmd) ? 'YES' : 'NO'));

            $process = new Process([$pdftoppmCmd, '-png', '-r', '200', $pdfPath, $tempDir . '/page']);
            $process->setTimeout(600);
            
            Log::info("[OCR] Running pdftoppm...");
            $process->run();

            if (!$process->isSuccessful()) {
                Log::error("[OCR] pdftoppm FAILED: " . $process->getErrorOutput());
                throw new ProcessFailedException($process);
            }
            Log::info("[OCR] pdftoppm completed successfully");

            // 2. Iterate over generated images and run Tesseract
            $files = glob($tempDir . '/page-*.png');
            sort($files, SORT_NATURAL);
            Log::info("[OCR] Found " . count($files) . " page images");

            // 2.1 Generate thumbnail from PDF (before OCR processing)
            Log::info("[OCR] Generating thumbnail...");
            $this->generateThumbnail($pdfPath);

            // 2.2 Compress PDF with Ghostscript
            Log::info("[OCR] Compressing PDF...");
            $this->compressPdf($pdfPath);

            $tesseractPath = env('TESSERACT_PATH', 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe');
            $ocrLang = env('OCR_LANG', 'rus');
            
            Log::info("[OCR] Tesseract path: {$tesseractPath}");
            Log::info("[OCR] Tesseract exists: " . (file_exists($tesseractPath) ? 'YES' : 'NO'));
            Log::info("[OCR] OCR language: {$ocrLang}");

            foreach ($files as $index => $imagePath) {
                Log::info("[OCR] Processing page " . ($index + 1) . "/" . count($files));
                
                $tessProcess = new Process([$tesseractPath, $imagePath, 'stdout', '-l', $ocrLang]);
                $tessProcess->setTimeout(600);
                $tessProcess->run();

                if (!$tessProcess->isSuccessful()) {
                    Log::error("[OCR] Tesseract FAILED on page " . ($index + 1) . ": " . $tessProcess->getErrorOutput());
                    throw new ProcessFailedException($tessProcess);
                }

                $pageText = $tessProcess->getOutput();
                $fullText .= $pageText . "\n\n";
                Log::info("[OCR] Page " . ($index + 1) . " extracted " . strlen($pageText) . " chars");
            }

            // 3. Save result
            $ocrResult->update([
                'status' => 'done',
                'full_text' => $fullText,
                'finished_at' => now(),
            ]);
            
            Log::info("[OCR] SUCCESS! Issue #{$this->issue->id} - Total text: " . strlen($fullText) . " chars");

        } catch (\Throwable $e) {
            Log::error("[OCR] FAILED for issue #{$this->issue->id}: " . $e->getMessage());
            
            $ocrResult->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'finished_at' => now(),
            ]);
            
            throw $e;
        } finally {
            // Cleanup temp files
            $tempFiles = glob("$tempDir/*.*");
            if ($tempFiles) {
                array_map('unlink', $tempFiles);
            }
            if (is_dir($tempDir)) {
                rmdir($tempDir);
            }
            Log::info("[OCR] Cleanup completed for issue #{$this->issue->id}");
        }
    }

    /**
     * Generate thumbnail from PDF (first page) using pdftoppm with low resolution
     */
    protected function generateThumbnail(string $pdfPath): void
    {
        try {
            Log::info("[OCR] Generating thumbnail for issue #{$this->issue->id}");
            
            $thumbnailDir = 'thumbnails';
            $thumbnailFilename = 'issue_' . $this->issue->id . '.jpg';
            $thumbnailPath = $thumbnailDir . '/' . $thumbnailFilename;
            
            // Ensure thumbnails directory exists
            Storage::disk('public')->makeDirectory($thumbnailDir);
            
            $absoluteThumbnailPath = Storage::disk('public')->path($thumbnailPath);
            
            // Use pdftoppm with low resolution directly to create small image
            $popplerPath = env('POPPLER_PATH', 'C:\\poppler\\bin');
            $pdftoppmCmd = "{$popplerPath}/pdftoppm.exe";
            
            // Create temp file for thumbnail
            $tempThumbPath = storage_path('app/temp/thumb_' . $this->issue->id);
            
            // Generate JPEG at 72 DPI, only first page (-f 1 -l 1)
            $process = new Process([
                $pdftoppmCmd, 
                '-jpeg',      // Output as JPEG
                '-r', '72',   // Low resolution (72 DPI)
                '-f', '1',    // First page only
                '-l', '1',    // Last page = first page
                '-singlefile', // Don't add page number suffix
                $pdfPath, 
                $tempThumbPath
            ]);
            $process->setTimeout(60);
            $process->run();
            
            if (!$process->isSuccessful()) {
                throw new \Exception('pdftoppm failed: ' . $process->getErrorOutput());
            }
            
            $generatedFile = $tempThumbPath . '.jpg';
            
            if (!file_exists($generatedFile)) {
                throw new \Exception('Thumbnail not generated');
            }
            
            // Move to final location
            rename($generatedFile, $absoluteThumbnailPath);
            
            // Update issue with thumbnail path
            $this->issue->update(['thumbnail_path' => $thumbnailPath]);
            
            Log::info("[OCR] Thumbnail generated: {$thumbnailPath}");
            
        } catch (\Throwable $e) {
            // Log error but don't fail the job - thumbnail is not critical
            Log::warning("[OCR] Failed to generate thumbnail for issue #{$this->issue->id}: " . $e->getMessage());
        }
    }

    /**
     * Compress PDF in-place using Ghostscript.
     * Replaces the original file with a smaller version.
     */
    protected function compressPdf(string $pdfPath): void
    {
        try {
            $enabled = config('pdf.compression.enabled', true);
            if (!$enabled) {
                Log::info("[OCR] PDF compression disabled, skipping.");
                return;
            }

            $gsPath  = config('pdf.compression.ghostscript_path', 'gs');
            $profile = config('pdf.compression.profile', 'ebook');
            $timeout = config('pdf.compression.timeout', 300);
            $gray    = config('pdf.compression.grayscale', false);

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
            Log::info("[OCR] Compressing PDF. Original size: {$originalSize} bytes. Profile: {$profile}");

            $process = new Process($command);
            $process->setTimeout($timeout);
            $process->run();

            if (!$process->isSuccessful()) {
                Log::warning("[OCR] Ghostscript failed, keeping original: " . $process->getErrorOutput());
                if (file_exists($tempOutput)) unlink($tempOutput);
                return;
            }

            if (!file_exists($tempOutput) || filesize($tempOutput) === 0) {
                Log::warning("[OCR] Ghostscript produced empty file, keeping original.");
                if (file_exists($tempOutput)) unlink($tempOutput);
                return;
            }

            $newSize = filesize($tempOutput);

            // Only replace if actually smaller
            if ($newSize < $originalSize) {
                rename($tempOutput, $pdfPath);
                $this->issue->update(['file_size' => $newSize]);
                $saved = round(($originalSize - $newSize) / 1024 / 1024, 2);
                Log::info("[OCR] Compression done. {$originalSize} -> {$newSize} bytes (saved {$saved} MB)");
            } else {
                Log::info("[OCR] Compressed file not smaller ({$newSize} >= {$originalSize}), keeping original.");
                unlink($tempOutput);
            }

        } catch (\Throwable $e) {
            Log::warning("[OCR] Compression failed (non-critical): " . $e->getMessage());
            // Compression failure is non-critical — OCR continues
        }
    }
}
