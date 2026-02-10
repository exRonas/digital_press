Write-Host "Starting Digital Press Queue Worker..." -ForegroundColor Green
Write-Host "This process handles PDF compression and OCR." -ForegroundColor Yellow
Write-Host "Do NOT close this window." -ForegroundColor Red

cd ../backend
php artisan queue:listen --tries=3 --timeout=600
