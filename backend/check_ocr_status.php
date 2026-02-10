<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\OcrResult;
use App\Models\Issue;

echo "=== OCR Status ===\n\n";

foreach (OcrResult::all() as $r) {
    $issue = Issue::find($r->issue_id);
    $title = $issue ? $issue->title : 'Unknown';
    echo "Issue #{$r->issue_id} ({$title}): {$r->status}";
    if ($r->full_text) {
        echo " - " . strlen($r->full_text) . " chars";
    }
    if ($r->error_message) {
        echo " - ERROR: {$r->error_message}";
    }
    echo "\n";
}

echo "\n=== Thumbnails ===\n\n";
foreach (Issue::all() as $issue) {
    echo "Issue #{$issue->id}: " . ($issue->thumbnail_path ?: 'NO THUMBNAIL') . "\n";
}
