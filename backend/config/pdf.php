<?php

return [
    /*
    |--------------------------------------------------------------------------
    | PDF Compression Settings
    |--------------------------------------------------------------------------
    */
    'compression' => [
        'enabled' => env('PDF_COMPRESSION_ENABLED', true),
        'method' => 'ghostscript', // currently only ghostscript is supported
        'ghostscript_path' => env('GHOSTSCRIPT_PATH', '/usr/bin/gs'),
        'profile' => env('PDF_COMPRESSION_PROFILE', 'ebook'), // screen, ebook, printer, prepress, default
        'grayscale' => env('PDF_COMPRESSION_GRAYSCALE', false),
        'timeout' => 300, // 5 minutes
    ],

    /*
    |--------------------------------------------------------------------------
    | Storage Paths
    |--------------------------------------------------------------------------
    */
    'paths' => [
        'original' => 'pdf/original',
        'optimized' => 'pdf/optimized',
    ],
];
