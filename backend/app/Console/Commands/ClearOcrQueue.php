<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ClearOcrQueue extends Command
{
    protected $signature = 'ocr:clear-queue';
    protected $description = 'Reset all stuck OCR tasks (queued/processing) to failed status';

    public function handle(): int
    {
        $count = DB::table('ocr_results')
            ->whereIn('status', ['queued', 'processing'])
            ->count();

        if ($count === 0) {
            $this->info('OCR queue is already empty.');
            return 0;
        }

        $this->warn("Found {$count} stuck OCR task(s). Resetting to 'failed'...");

        DB::table('ocr_results')
            ->whereIn('status', ['queued', 'processing'])
            ->update([
                'status'        => 'failed',
                'error_message' => 'Manually reset via ocr:clear-queue command',
            ]);

        $this->info("Done. {$count} task(s) reset.");
        return 0;
    }
}
