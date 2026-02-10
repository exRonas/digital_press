<?php

namespace App\Console\Commands;

use App\Models\Issue;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;

class GenerateThumbnails extends Command
{
    protected $signature = 'issues:generate-thumbnails 
                            {--force : Regenerate thumbnails even if they exist}
                            {--issue= : Generate for specific issue ID only}';

    protected $description = 'Generate thumbnails from the first page of PDF issues';

    public function handle()
    {
        $query = Issue::query();
        
        if ($issueId = $this->option('issue')) {
            $query->where('id', $issueId);
        }
        
        if (!$this->option('force')) {
            $query->whereNull('thumbnail_path');
        }
        
        $issues = $query->get();
        
        if ($issues->isEmpty()) {
            $this->info('No issues to process.');
            return 0;
        }
        
        $this->info("Processing {$issues->count()} issue(s)...");
        $bar = $this->output->createProgressBar($issues->count());
        $bar->start();
        
        $success = 0;
        $failed = 0;
        
        foreach ($issues as $issue) {
            try {
                $this->generateThumbnail($issue);
                $success++;
            } catch (\Throwable $e) {
                $this->newLine();
                $this->error("Issue #{$issue->id}: " . $e->getMessage());
                $failed++;
            }
            $bar->advance();
        }
        
        $bar->finish();
        $this->newLine(2);
        $this->info("Done! Success: {$success}, Failed: {$failed}");
        
        return 0;
    }
    
    protected function generateThumbnail(Issue $issue): void
    {
        // Get PDF path
        $pdfPath = Storage::disk('public')->path($issue->file_path);
        
        if (!file_exists($pdfPath)) {
            throw new \Exception("PDF not found: {$issue->file_path}");
        }
        
        // Create temp directory
        $tempDir = storage_path('app/temp/thumb_' . $issue->id);
        if (!file_exists($tempDir)) {
            mkdir($tempDir, 0755, true);
        }
        
        try {
            // Use pdftoppm to convert first page only (-f 1 -l 1)
            $popplerPath = env('POPPLER_PATH', 'C:\\poppler\\bin');
            $pdftoppmCmd = "{$popplerPath}\\pdftoppm.exe";
            
            $process = new Process([
                $pdftoppmCmd, 
                '-png', 
                '-r', '150',  // Lower resolution for thumbnail
                '-f', '1',    // First page
                '-l', '1',    // Last page (same = only first)
                $pdfPath, 
                $tempDir . '/page'
            ]);
            $process->setTimeout(60);
            $process->run();
            
            if (!$process->isSuccessful()) {
                throw new \Exception("pdftoppm failed: " . $process->getErrorOutput());
            }
            
            // Find generated image
            $files = glob($tempDir . '/page-*.png');
            if (empty($files)) {
                throw new \Exception("No image generated from PDF");
            }
            
            $firstPagePath = $files[0];
            
            // Generate thumbnail
            $thumbnailDir = 'thumbnails';
            $thumbnailFilename = 'issue_' . $issue->id . '.jpg';
            $thumbnailPath = $thumbnailDir . '/' . $thumbnailFilename;
            
            Storage::disk('public')->makeDirectory($thumbnailDir);
            $absoluteThumbnailPath = Storage::disk('public')->path($thumbnailPath);
            
            // Use GD to resize
            $sourceImage = imagecreatefrompng($firstPagePath);
            if (!$sourceImage) {
                throw new \Exception('Failed to load source image');
            }
            
            $sourceWidth = imagesx($sourceImage);
            $sourceHeight = imagesy($sourceImage);
            
            $maxWidth = 400;
            $ratio = $maxWidth / $sourceWidth;
            $targetWidth = $maxWidth;
            $targetHeight = (int) ($sourceHeight * $ratio);
            
            $thumbnail = imagecreatetruecolor($targetWidth, $targetHeight);
            $white = imagecolorallocate($thumbnail, 255, 255, 255);
            imagefill($thumbnail, 0, 0, $white);
            
            imagecopyresampled(
                $thumbnail, $sourceImage,
                0, 0, 0, 0,
                $targetWidth, $targetHeight,
                $sourceWidth, $sourceHeight
            );
            
            imagejpeg($thumbnail, $absoluteThumbnailPath, 85);
            
            imagedestroy($sourceImage);
            imagedestroy($thumbnail);
            
            // Update issue
            $issue->update(['thumbnail_path' => $thumbnailPath]);
            
        } finally {
            // Cleanup
            array_map('unlink', glob("$tempDir/*.*"));
            if (is_dir($tempDir)) {
                rmdir($tempDir);
            }
        }
    }
}
