<?php

namespace App\Jobs;

use App\Models\File;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

class CompressPdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The file instance.
     *
     * @var \App\Models\File
     */
    public $fileModel;

    /**
     * Create a new job instance.
     */
    public function __construct(File $file)
    {
        $this->fileModel = $file;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $file = $this->fileModel;
        
        Log::info("[CompressPdfJob] Starting compression for file #{$file->id}");

        try {
            // Update status
            $file->update(['status' => 'compressing']);

            // Get configuration
            $useGrayscale = Config::get('pdf.compression.grayscale', false);
            $profile = Config::get('pdf.compression.profile', 'ebook');
            $timeout = Config::get('pdf.compression.timeout', 300);
            $gsPath = Config::get('pdf.compression.ghostscript_path', 'gs');

            // Determine paths (absolute paths for GS)
            // Note: 'original_path' in DB is relative to storage/app/
            // 'stored_path' will serve as the output location for optimized file
            
            // Input file: stored in 'original_path' (e.g., pdf/original/{uuid}.pdf)
            if (!$file->original_path || !Storage::exists($file->original_path)) {
                 throw new Exception("Original file not found at: {$file->original_path}");
            }
            $inputPath = Storage::path($file->original_path);

            // Output file: we will use 'pdf/optimized/{uuid}.pdf'
            $pathInfo = pathinfo($file->original_path);
            $uuidName = $pathInfo['basename'];
            $optimizedRelativePath = Config::get('pdf.paths.optimized', 'pdf/optimized') . '/' . $uuidName;
            
            // Ensure output directory exists
            $optimizedDir = dirname(Storage::path($optimizedRelativePath));
            if (!is_dir($optimizedDir)) {
                mkdir($optimizedDir, 0755, true);
            }
            
            $outputPath = Storage::path($optimizedRelativePath);
            
            // Build Ghostscript command
            $command = [
                $gsPath,
                '-sDEVICE=pdfwrite',
                '-dCompatibilityLevel=1.4',
                "-dPDFSETTINGS=/{$profile}",
                '-dNOPAUSE',
                '-dQUIET',
                '-dBATCH',
                "-sOutputFile={$outputPath}",
            ];

            if ($useGrayscale) {
                $command[] = '-sColorConversionStrategy=Gray';
                $command[] = '-dProcessColorModel=/DeviceGray';
            }

            $command[] = $inputPath;

            Log::info("[CompressPdfJob] Command: " . implode(' ', $command));

            $process = new Process($command);
            $process->setTimeout($timeout);
            $process->run();

            if (!$process->isSuccessful()) {
                throw new ProcessFailedException($process);
            }

            // Verify output exists and has size
            if (!file_exists($outputPath) || filesize($outputPath) === 0) {
                throw new Exception("Ghostscript failed to generate output file");
            }

            // Success! 
            $newSize = filesize($outputPath);
            $newSha256 = hash_file('sha256', $outputPath);
            
            // Delete the ORIGINAL file to save space
            if (file_exists($inputPath)) {
                unlink($inputPath);
                Log::info("[CompressPdfJob] Deleted original file: {$inputPath}");
            }

            $file->update([
                'stored_path' => $optimizedRelativePath, // Now points to optimized
                'size' => $newSize,
                'sha256' => $newSha256,
                'status' => 'processing_ocr', // Moving to next step
            ]);
            
            Log::info("[CompressPdfJob] Compression successful. New size: {$newSize}");

            // Dispatch OCR Job if Issue attached
            if ($file->issue) {
                 // Update Issue file path as well so OCR can find it
                 $file->issue->update([
                     'file_path' => $optimizedRelativePath,
                     'file_size' => $newSize
                 ]);

                 Log::info("[CompressPdfJob] Dispatching OCR for Issue #{$file->issue->id}");
                 ProcessOcrJob::dispatch($file->issue);
            }

        } catch (Exception $e) {
            Log::error("[CompressPdfJob] Failed: " . $e->getMessage());
            
            $file->update([
                'status' => 'failed',
                'error_message' => substr($e->getMessage(), 0, 1000)
            ]);
            
            // If failed, we might want to revert stored_path to original if it was somehow changed,
            // but here we haven't changed stored_path until success.
            // However, we might want to allow using the original file as fallback?
            // For now, failure stops the pipeline.
            
            throw $e;
        }
    }
}
