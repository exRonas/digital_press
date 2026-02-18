<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use App\Models\Publication;
use App\Models\Issue;
use App\Jobs\ProcessOcrJob;
use Carbon\Carbon;
use Str;

class ImportIssues extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'import:issues {path : Full path to the directory containing PDFs} {--dry-run : Simulate without saving}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Bulk import PDF newspapers from a directory structure';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $path = $this->argument('path');
        $dryRun = $this->option('dry-run');

        if (!File::isDirectory($path)) {
            $this->error("Directory not found: $path");
            return 1;
        }

        $files = File::allFiles($path);
        $this->info("Found " . count($files) . " files. Processing...");

        $success = 0;
        $skipped = 0;

        foreach ($files as $file) {
            if ($file->getExtension() !== 'pdf') {
                continue;
            }

            $filename = $file->getFilename();
            $relativePath = $file->getRelativePath(); // e.g., "Saryarka Samaly/2023"
            
            // 1. Try to detect Publication from Folder Name or Filename
            $publication = $this->detectPublication($relativePath, $filename);
            
            if (!$publication) {
                $this->warn("Skipping [$filename]: Could not detect publication.");
                $skipped++;
                continue;
            }

            // 2. Try to detect Date
            $date = $this->detectDate($filename);
            if (!$date) {
                // Try to fallback to folder structure if it contains year? Too risky.
                $this->warn("Skipping [$filename]: Could not detect date (Format should be YYYY-MM-DD or DD.MM.YYYY).");
                $skipped++;
                continue;
            }

            // 3. Detect Issue Number
            $number = $this->detectNumber($filename);

            // 4. Detect Language (default to publication logic or filename)
            $language = $this->detectLanguage($filename, $publication);

            $this->line("Found: [{$publication->title_ru}] Date: $date No: $number Lang: $language");

            if (!$dryRun) {
                // Determine target path
                // We physically copy the file to Laravel storage
                $storageDir = "issues/" . $publication->id . "/" . Carbon::parse($date)->format('Y');
                $newFilename = Str::slug($publication->title_ru) . "_" . $date . "_" . $number . ".pdf";
                $targetPath = $storageDir . "/" . $newFilename;

                if (!Storage::disk('public')->exists($targetPath)) {
                    // Copy file using streams (better memory usage)
                    File::ensureDirectoryExists(Storage::disk('public')->path(dirname($targetPath)));
                    File::copy($file->getRealPath(), Storage::disk('public')->path($targetPath));
                    
                    // Create DB Record
                    $issue = Issue::create([
                        'publication_id' => $publication->id,
                        'issue_date' => $date,
                        'issue_number' => $number,
                        'language' => $language,
                        'file_path' => $targetPath,
                        'file_size' => $file->getSize(),
                        'created_by' => 1, // Admin
                    ]);
                    
                    // Dispatch OCR/Thumbnail Job
                    // We assume ProcessOcrJob exists and handles generation
                    try {
                        dispatch(new ProcessOcrJob($issue));
                    } catch (\Exception $e) {
                        $this->error("Error dispatching job for Issue ID {$issue->id}: " . $e->getMessage());
                    }

                    $success++;
                } else {
                    $this->warn("File already exists in storage, skipping.");
                    $skipped++;
                }
            }
        }

        $this->info("Done. Imported: $success. Skipped: $skipped.");
        if ($dryRun) {
            $this->info("This was a DRY RUN. No changes made.");
        }
    }

    private function detectPublication($folder, $filename)
    {
        // Get all publications and check if their slug or title is in the string
        $pubs = Publication::all();
        
        // Check folder first (folder usually has full name)
        foreach ($pubs as $pub) {
             if (Str::contains(Str::lower($folder), Str::lower($pub->title_ru)) || 
                 Str::contains(Str::lower($folder), Str::lower($pub->title_kz)) ||
                 Str::contains(Str::lower($filename), Str::lower($pub->slug)) ||
                 Str::contains(Str::lower($filename), Str::lower($pub->title_ru))) { // Added filename check for RU title
                 return $pub;
             }
        }
        return null;
    }

    private function detectDate($filename)
    {
        // 1. Standard Formats: 2023-11-25 or 25.11.2023
        if (preg_match('/(\d{4})[-_](\d{2})[-_](\d{2})/', $filename, $matches)) {
            return "{$matches[1]}-{$matches[2]}-{$matches[3]}";
        }
        if (preg_match('/(\d{2})\.(\d{2})\.(\d{4})/', $filename, $matches)) {
            return "{$matches[3]}-{$matches[2]}-{$matches[1]}";
        }

        // 2. Custom Format: "2014 г. 1 декабрь" or "10 март"
        // Need to parse months in Russian and Kazakh
        $months = [
            'январь' => '01', 'февраль' => '02', 'март' => '03', 'апрель' => '04',
            'май' => '05', 'июнь' => '06', 'июль' => '07', 'август' => '08',
            'сентябрь' => '09', 'октябрь' => '10', 'ноябрь' => '11', 'декабрь' => '12',
            // Genetive case just in case
            'января' => '01', 'февраля' => '02', 'марта' => '03', 'апреля' => '04',
            'мая' => '05', 'июня' => '06', 'июля' => '07', 'августа' => '08',
            'сентября' => '09', 'октября' => '10', 'ноября' => '11', 'декабря' => '12',
            // Kazakh months
            'қаңтар' => '01', 'ақпан' => '02', 'наурыз' => '03', 'сәуір' => '04',
            'мамыр' => '05', 'маусым' => '06', 'шілде' => '07', 'тамыз' => '08',
            'қыркүйек' => '09', 'қазан' => '10', 'қараша' => '11', 'желтоқсан' => '12',
        ];

        // Try to find Year (4 digits followed by optional г or ж)
        $year = null;
        if (preg_match('/(\d{4})\s*(?:г|ж)?\./ui', $filename, $yMatches) || preg_match('/(\d{4})\s*(?:г|ж)/ui', $filename, $yMatches)) {
            $year = $yMatches[1];
        }

        // Try to find Day and Month
        foreach ($months as $monthName => $monthNum) {
            // Check if month name exists in string (case-insensitive)
            if (mb_stripos($filename, $monthName) !== false) {
                // Find date: number preceding the month name
                // "1 декабрь" or "10 қаңтар"
                // Regex: digit(s) + spaces + monthName
                if (preg_match('/(\d{1,2})\s+' . preg_quote($monthName) . '/ui', $filename, $dMatches)) {
                    $day = str_pad($dMatches[1], 2, '0', STR_PAD_LEFT);
                    
                    if ($year) {
                        return "{$year}-{$monthNum}-{$day}";
                    }
                    // Fallback: If no year in filename, check if we found year earlier in execution context? 
                    // No, context is local. Let's assume current year or skip?
                    // Better to rely on folder name (relativePath) if needed, but passing that down is cleaner.
                    // For now, let's assume if "г." is missing, we check blindly for 4 digits
                    if (preg_match('/(\d{4})/', $filename, $globMatches)) {
                         return "{$globMatches[1]}-{$monthNum}-{$day}";
                    }
                }
            }
        }

        return null;
    }

    private function detectNumber($filename)
    {
        // Custom Format: "№ 47 (941)" -> We want 47.
        // Regex looks for "№" followed by space?, then digits, then maybe space and parens
        
        // This regex captures the FIRST number after № symbol
        if (preg_match('/№\s*(\d+)/u', $filename, $matches)) {
            return $matches[1];
        }

        // Fallback to standard
        if (preg_match('/(?:No|#|_|\s)(\d+)/i', $filename, $matches)) {
            return $matches[1];
        }
        
        return '1';
    }

    private function detectLanguage($filename, $publication)
    {
        if (Str::contains(Str::lower($filename), ['kk', 'kz', 'kaz'])) return 'kz';
        if (Str::contains(Str::lower($filename), ['ru', 'rus'])) return 'ru';
        
        // Heuristic based on Pub title? 
        // If pub title is ONLY kz, maybe default to kz?
        return 'ru'; // Default
    }
}
