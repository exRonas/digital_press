# Check if php-cgi is in PATH
if (!(Get-Command "php-cgi.exe" -ErrorAction SilentlyContinue)) {
    Write-Error "php-cgi.exe not found in PATH. Please verify your PHP installation."
    exit 1
}

Write-Host "Stopping old php-cgi processes..." -ForegroundColor Yellow
Get-Process php-cgi -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "Starting PHP-CGI on 127.0.0.1:9000..." -ForegroundColor Green
# Start php-cgi invisible window
Start-Process -FilePath "php-cgi.exe" -ArgumentList "-b 127.0.0.1:9000" -WindowStyle Hidden

Write-Host "PHP-CGI is running." -ForegroundColor Green
Write-Host "Now ensure Nginx is running and includes the config: " -NoNewline
Write-Host "$PWD\nginx\digital-press.conf" -ForegroundColor Cyan
