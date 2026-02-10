<?php

use Illuminate\Support\Facades\Route;

// For any route that is NOT an API route, return the React app
// This allows React Router to handle the routing on the client side
Route::get('/{any}', function () {
    return view('index'); // This will look for resources/views/index.blade.php
})->where('any', '.*');
