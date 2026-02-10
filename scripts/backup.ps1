# Configuration
$BackupDir = "C:\Backups\DigitalPress"
$StorageDir = "C:\inetpub\wwwroot\digital_press\backend\storage\app\issues"
$DbParams = "-U postgres -h localhost" # Add PGPASSWORD env var or pgpass file
$DbName = "digital_press"
$RetentionDays = 14
$Date = Get-Date -Format "yyyy-MM-dd_HH-mm"

# Create backup directory if not exists
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Force -Path $BackupDir
}

# 1. Database Backup
$DumpFile = "$BackupDir\db_$Date.sql"
$Env:PGPASSWORD = "your_db_password" # BETTER: Use .pgpass file
& "C:\Program Files\PostgreSQL\13\bin\pg_dump.exe" $DbParams -d $DbName -f $DumpFile

# 2. Files Backup (Zip storage/app/issues)
$ZipFile = "$BackupDir\files_$Date.zip"
Compress-Archive -Path $StorageDir -DestinationPath $ZipFile

# 3. Cleanup old backups
Get-ChildItem -Path $BackupDir | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$RetentionDays) } | Remove-Item

Write-Host "Backup completed: $Date"
