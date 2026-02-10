<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Issue extends Model
{
    use HasFactory;

    protected $fillable = [
        'publication_id',
        'issue_date',
        'issue_number',
        'language',
        'file_path',
        'thumbnail_path',
        'file_id',
        'file_size',
        'mime_type',
        'created_by',
    ];

    protected $appends = ['thumbnail_url'];

    /**
     * Get the thumbnail URL for the issue
     * Returns relative path that works with proxy
     */
    public function getThumbnailUrlAttribute(): ?string
    {
        if ($this->thumbnail_path) {
            // Return relative URL - frontend proxy will handle it
            return '/storage/' . $this->thumbnail_path;
        }
        return null;
    }

    public function publication()
    {
        return $this->belongsTo(Publication::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * New file relation (for X-Accel-Redirect system)
     */
    public function file()
    {
        return $this->belongsTo(File::class);
    }

    /**
     * Legacy: files attached to this issue
     */
    public function files()
    {
        return $this->hasMany(File::class);
    }

    public function ocrResult()
    {
        return $this->hasOne(OcrResult::class);
    }

    public function stats()
    {
        return $this->hasOne(IssueStat::class);
    }
}
