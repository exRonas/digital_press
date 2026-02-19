<?php

namespace App\Console\Commands;

use App\Models\Issue;
use Illuminate\Console\Command;

class BackfillIssueStats extends Command
{
    protected $signature = 'issues:backfill-stats';
    protected $description = 'Create missing issue_stats rows for issues imported without stats (views/downloads will start counting from 0)';

    public function handle(): int
    {
        $issues = Issue::doesntHave('stats')->get();

        if ($issues->isEmpty()) {
            $this->info('All issues already have stats records. Nothing to do.');
            return 0;
        }

        $this->info("Found {$issues->count()} issues without stats. Creating records...");

        $bar = $this->output->createProgressBar($issues->count());
        $bar->start();

        foreach ($issues as $issue) {
            $issue->stats()->create([
                'issue_id'        => $issue->id,
                'views_count'     => 0,
                'downloads_count' => 0,
            ]);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Done. Created {$issues->count()} stats records.");
        return 0;
    }
}
