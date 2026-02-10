<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IssueStat extends Model
{
    protected $fillable = [
        'issue_id',
        'views_count',
        'downloads_count',
        'last_viewed_at',
        'last_downloaded_at',
    ];
    
    public $timestamps = true;

    protected $dates = ['last_viewed_at', 'last_downloaded_at'];

    public function issue()
    {
        return $this->belongsTo(Issue::class);
    }
}
