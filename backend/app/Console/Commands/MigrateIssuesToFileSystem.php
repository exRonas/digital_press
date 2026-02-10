<?php

namespace App\Console\Commands;

use App\Models\Issue;
use App\Models\File;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MigrateIssuesToFileSystem extends Command
{
    protected $signature = 'issues:migrate-files {--dry-run : Preview changes without making them}';
    protected $description = 'Migrate existing issues to the new File system for X-Accel-Redirect';

    public function handle()
    {
        $dryRun = $this->option('dry-run');
        
        if ($dryRun) {
            $this->info('🔍 DRY RUN MODE - No changes will be made');
        }

        $issues = Issue::whereNull('file_id')
            ->whereNotNull('file_path')
            ->get();

        $this->info("Found {$issues->count()} issues to migrate");

        $migrated = 0;
        $errors = 0;

        foreach ($issues as $issue) {
            $this->line("Processing Issue #{$issue->id}: {$issue->file_path}");

            // Check if old file exists
            $oldPath = $issue->file_path;
            
            // Try both public and local disks
            $disk = Storage::disk('public')->exists($oldPath) ? 'public' : 'local';
            
            if (!Storage::disk($disk)->exists($oldPath)) {
                $this->error("  ❌ File not found: {$oldPath}");
                $errors++;
                continue;
            }

            if ($dryRun) {
                $this->info("  ✓ Would migrate: {$oldPath}");
                $migrated++;
                continue;
            }

            try {
                // Generate new path
                $uuid = Str::uuid();
                $year = date('Y', strtotime($issue->issue_date));
                $newPath = "private/pdfs/{$year}/{$uuid}.pdf";

                // Ensure directory exists
                $directory = storage_path("app/private/pdfs/{$year}");
                if (!is_dir($directory)) {
                    mkdir($directory, 0755, true);
                }

                // Copy file to new location
                $oldFullPath = Storage::disk($disk)->path($oldPath);
                $newFullPath = storage_path("app/{$newPath}");
                
                copy($oldFullPath, $newFullPath);

                // Calculate SHA256
                $sha256 = hash_file('sha256', $newFullPath);

                // Create File record
                $file = File::create([
                    'original_name' => basename($oldPath),
                    'stored_path' => $newPath,
                    'mime_type' => $issue->mime_type ?? 'application/pdf',
                    'size' => $issue->file_size ?? filesize($newFullPath),
                    'sha256' => $sha256,
                    'issue_id' => $issue->id,
                    'uploaded_by' => $issue->created_by,
                ]);

                // Update issue
                $issue->update([
                    'file_id' => $file->id,
                ]);

                $this->info("  ✓ Migrated to: {$newPath} (File #{$file->id})");
                $migrated++;

            } catch (\Exception $e) {
                $this->error("  ❌ Error: {$e->getMessage()}");
                $errors++;
            }
        }

        $this->newLine();
        $this->info("Migration complete:");
        $this->info("  ✓ Migrated: {$migrated}");
        $this->info("  ❌ Errors: {$errors}");

        if ($dryRun) {
            $this->newLine();
            $this->warn('Run without --dry-run to apply changes');
        }

        return 0;
    }
}
