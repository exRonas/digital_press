<?php

namespace App\Console\Commands;

use App\Jobs\ProcessOcrJob;
use App\Models\Issue;
use App\Models\OcrResult;
use Illuminate\Console\Command;

class RetryFailedOcr extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ocr:retry {--all : Retry all failed OCR jobs}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Retry failed OCR jobs';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $count = OcrResult::where('status', 'failed')->count();
        
        if ($count === 0) {
            $this->info('No failed OCR jobs found.');
            return;
        }
        
        $this->info("Found {$count} failed OCR jobs.");
        
        if (!$this->option('all') && !$this->confirm('Do you want to retry them?')) {
            return;
        }
        
        OcrResult::where('status', 'failed')->update(['status' => 'queued']);
        
        $issues = Issue::whereHas('ocrResult', function ($query) {
            $query->where('status', 'queued');
        })->get();
        
        foreach ($issues as $issue) {
            ProcessOcrJob::dispatch($issue);
            $this->line("Dispatched OCR job for issue #{$issue->id}");
        }
        
        $this->info("Dispatched {$issues->count()} OCR jobs. Run 'php artisan queue:work' to process them.");
    }
}
