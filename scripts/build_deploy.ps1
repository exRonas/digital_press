Write-Host "Starting Build and Deploy process..." -ForegroundColor Green

# 1. Define paths
$root = Get-Location
$frontendDir = Join-Path $root "frontend"
$backendPublicDir = Join-Path $root "backend\public"
$backendViewsDir = Join-Path $root "backend\resources\views"
$distDir = Join-Path $frontendDir "dist"

# 2. Build Frontend
Write-Host "Building Frontend (React/Vite)..." -ForegroundColor Yellow
Set-Location $frontendDir
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

# 3. Clean old assets in backend
Write-Host "Cleaning old assets in backend..." -ForegroundColor Yellow
if (Test-Path "$backendPublicDir\assets") {
    Remove-Item "$backendPublicDir\assets" -Recurse -Force
}
if (Test-Path "$backendViewsDir\index.blade.php") {
    Remove-Item "$backendViewsDir\index.blade.php" -Force
}

# 4. Copy new assets
Write-Host "Copying new assets..." -ForegroundColor Yellow

# Copy 'assets' folder (JS/CSS)
if (Test-Path "$distDir\assets") {
    Copy-Item "$distDir\assets" -Destination "$backendPublicDir" -Recurse
    Write-Host "Assets copied." -ForegroundColor Green
}

# Copy favicon and other public files (except index.html)
Get-ChildItem -Path $distDir -Exclude "index.html", "assets" | ForEach-Object {
    Copy-Item $_.FullName -Destination $backendPublicDir -Recurse -Force
}

# 5. Move and rename index.html -> index.blade.php
Write-Host "Deploying index.html to Laravel views..." -ForegroundColor Yellow
if (Test-Path "$distDir\index.html") {
    Copy-Item "$distDir\index.html" -Destination "$backendViewsDir\index.blade.php"
    
    # Optional: Fix asset paths if needed (Vite usually handles this with base: '/')
    # $content = Get-Content "$backendViewsDir\index.blade.php"
    # $content = $content -replace 'src="/assets', 'src="/assets' 
    # Set-Content "$backendViewsDir\index.blade.php" $content
    
    Write-Host "index.blade.php created." -ForegroundColor Green
} else {
    Write-Host "Error: index.html not found!" -ForegroundColor Red
    exit 1
}

# Return to root
Set-Location $root
Write-Host "Deployment preparation complete!" -ForegroundColor Cyan
Write-Host "You can now zip the project or deploy it." -ForegroundColor Cyan
