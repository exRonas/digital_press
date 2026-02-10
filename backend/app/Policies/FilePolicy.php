<?php

namespace App\Policies;

use App\Models\File;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class FilePolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any files.
     */
    public function viewAny(?User $user): bool
    {
        // Public catalog - anyone can list files
        return true;
    }

    /**
     * Determine whether the user can view the file.
     * 
     * This is the main authorization check for file access.
     * Customize this based on your business logic.
     */
    public function view(?User $user, File $file): bool
    {
        // Option 1: All files are public (for newspaper archive)
        // This is the simplest case - anyone can view published issues
        if ($file->issue_id) {
            // If file belongs to an issue, it's part of public archive
            return true;
        }

        // Option 2: Check ownership
        // if ($file->uploaded_by && $user && $file->uploaded_by === $user->id) {
        //     return true;
        // }

        // Option 3: Check if user has specific permission
        // if ($user && $user->can('view-all-files')) {
        //     return true;
        // }

        // Option 4: Check fileable relationship
        // if ($file->fileable) {
        //     return $user->can('view', $file->fileable);
        // }

        // Default: authenticated users can view
        return $user !== null;
    }

    /**
     * Determine whether the user can download the file.
     */
    public function download(?User $user, File $file): bool
    {
        // Same logic as view for now
        return $this->view($user, $file);
    }

    /**
     * Determine whether the user can create files.
     */
    public function create(User $user): bool
    {
        // Only operators and admins can upload
        return in_array($user->role, ['operator', 'admin']);
    }

    /**
     * Determine whether the user can delete the file.
     */
    public function delete(User $user, File $file): bool
    {
        // Admins can delete any file
        if ($user->role === 'admin') {
            return true;
        }

        // Operators can delete files they uploaded
        if ($user->role === 'operator' && $file->uploaded_by === $user->id) {
            return true;
        }

        return false;
    }
}
