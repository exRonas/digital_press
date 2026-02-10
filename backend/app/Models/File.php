<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class File extends Model
{
    use HasFactory;

    protected $fillable = [
        'original_name',
        'stored_path',
        'original_path',
        'mime_type',
        'status',
        'error_message',
        'size',
        'sha256',
        'fileable_type',
        'fileable_id',
        'issue_id',
        'uploaded_by',
    ];

    protected $casts = [
        'size' => 'integer',
    ];

    /**
     * Get the parent fileable model (Issue, Course, etc.)
     */
    public function fileable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Direct relation to Issue (backward compatibility)
     */
    public function issue(): BelongsTo
    {
        return $this->belongsTo(Issue::class);
    }

    /**
     * User who uploaded the file
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /**
     * Get the full storage path for Nginx X-Accel-Redirect
     */
    public function getAccelRedirectPath(): string
    {
        // /_protected/ maps to storage/app/ in Nginx
        // If using 'public' disk, we need to prepend 'public/' because alias is storage/app/
        // If using 'local' disk, we need to prepend 'private/'
        
        $disk = config('filesystems.default');
        $prefix = '';
        
        if ($disk === 'public') {
            $prefix = 'public/';
        } elseif ($disk === 'local') {
            $prefix = 'private/';
        }
        
        return '/_protected/' . $prefix . $this->stored_path;
    }

    /**
     * Get the full disk path
     */
    public function getFullDiskPath(): string
    {
        // Use Storage facade to respect disk configuration
        return \Illuminate\Support\Facades\Storage::path($this->stored_path);
    }

    /**
     * Check if file exists on disk
     */
    public function existsOnDisk(): bool
    {
        return file_exists($this->getFullDiskPath());
    }

    /**
     * Format file size for display
     */
    public function getFormattedSizeAttribute(): string
    {
        $bytes = $this->size;
        $units = ['B', 'KB', 'MB', 'GB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }
}
