<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OcrResult extends Model
{
    protected $fillable = [
        'issue_id',
        'status', // queued, processing, done, failed
        'full_text',
        'error_message',
        'started_at',
        'finished_at',
    ];

    protected $dates = ['started_at', 'finished_at'];

    public function issue()
    {
        return $this->belongsTo(Issue::class);
    }
}
