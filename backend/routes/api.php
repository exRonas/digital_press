<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\IssueController;
use App\Http\Controllers\PublicationController;
use App\Http\Controllers\StatisticsController;
use App\Http\Controllers\ChunkedUploadController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\UserController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout']);

// Catalog Public
Route::get('/publications', [PublicationController::class, 'index']);
Route::get('/publications/{publication}', [PublicationController::class, 'showPublic']);
Route::get('/issues/years', [IssueController::class, 'years']); // New route
Route::get('/issues', [IssueController::class, 'index']);
Route::get('/issues/{id}', [IssueController::class, 'show']);
Route::get('/issues/{id}/download', [IssueController::class, 'download']);
Route::get('/issues/{id}/view', [IssueController::class, 'view']);

// File API - Public access (with policy checks inside)
Route::get('/files', [FileController::class, 'index']);
Route::get('/files/{file}', [FileController::class, 'show']);
Route::get('/files/{file}/open', [FileController::class, 'open']);      // X-Accel-Redirect (view inline)
Route::get('/files/{file}/download', [FileController::class, 'download']); // X-Accel-Redirect (download)
Route::get('/files/{file}/url', [FileController::class, 'url']);        // Get URL for frontend

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);

    // File upload (protected)
    Route::post('/files', [FileController::class, 'store']);
    Route::delete('/files/{file}', [FileController::class, 'destroy']);

    // Admin / Operator Only
    Route::middleware('role:operator')->group(function () {
        Route::get('/admin/stats', [StatisticsController::class, 'index']);
        
        // Issues management
        Route::get('/admin/issues', [IssueController::class, 'adminIndex']);
        Route::post('/admin/issues', [IssueController::class, 'store']);
        
        // Chunked Upload (for large files 100MB+)
        Route::post('/admin/upload/init', [ChunkedUploadController::class, 'init']);
        Route::post('/admin/upload/chunk', [ChunkedUploadController::class, 'chunk']);
        Route::post('/admin/upload/complete', [ChunkedUploadController::class, 'complete']);
        Route::post('/admin/upload/abort', [ChunkedUploadController::class, 'abort']);
        
        Route::post('/admin/issues/{id}/ocr', [IssueController::class, 'retryOcr']);
        Route::put('/admin/issues/{id}', [IssueController::class, 'update']);
        Route::delete('/admin/issues/{id}', [IssueController::class, 'destroy']);
    });

    // Admin Only
    Route::middleware('role:admin')->group(function () {
        // Publications CRUD
        Route::get('/admin/publications', [PublicationController::class, 'adminIndex']);
        Route::post('/admin/publications', [PublicationController::class, 'store']);
        Route::get('/admin/publications/{publication}', [PublicationController::class, 'show']);
        Route::put('/admin/publications/{publication}', [PublicationController::class, 'update']);
        Route::delete('/admin/publications/{publication}', [PublicationController::class, 'destroy']);
        
        // Users CRUD
        Route::get('/admin/users', [UserController::class, 'index']);
        Route::post('/admin/users', [UserController::class, 'store']);
        Route::get('/admin/users/{user}', [UserController::class, 'show']);
        Route::put('/admin/users/{user}', [UserController::class, 'update']);
        Route::delete('/admin/users/{user}', [UserController::class, 'destroy']);
    });
});
