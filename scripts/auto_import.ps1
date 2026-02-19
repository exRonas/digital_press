param (
    [string]$ImportPath = "C:\zagr"
)

# --- SETTINGS ---
$BackendDir        = Join-Path $PSScriptRoot "..\backend"
$LockFile          = Join-Path $PSScriptRoot "auto_import.lock"
$LogFile           = Join-Path $PSScriptRoot "..\backend\storage\logs\auto_import.log"
$MaxWaitOcrMinutes = 120

# --- Create log directory if missing ---
$logDir = Split-Path $LogFile
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $ts   = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$ts] [$Level] $Message"
    Add-Content -Path $LogFile -Value $line -Encoding UTF8
    Write-Host $line
}

function Get-OcrPendingCount {
    $raw = & php artisan tinker --no-ansi --execute="echo \DB::table('ocr_results')->whereIn('status',['queued','processing'])->count();" 2>$null
    $match = $raw | Select-String -Pattern '^\d+$' | Select-Object -Last 1
    if ($match) { return [int]($match.ToString().Trim()) }
    return 0
}

# ===================== START =====================
Set-Location $BackendDir

Write-Log "========================================"
Write-Log "Auto-import started. Folder: $ImportPath"

# 1. Check lock file
if (Test-Path $LockFile) {
    $lockAge = (Get-Date) - (Get-Item $LockFile).LastWriteTime
    if ($lockAge.TotalHours -lt 8) {
        Write-Log ("Lock file exists ({0} min old). Previous run still active - exiting." -f [int]$lockAge.TotalMinutes) "WARN"
        exit 0
    } else {
        Write-Log "Lock file is stale (>8h), removing and continuing." "WARN"
        Remove-Item $LockFile -Force
    }
}

# 2. Check if previous OCR queue is still pending
$pendingOcr = Get-OcrPendingCount
if ($pendingOcr -gt 0) {
    Write-Log "Found $pendingOcr OCR tasks (queued/processing). Waiting before new import..." "WARN"
    $waited = 0
    while ($pendingOcr -gt 0 -and $waited -lt $MaxWaitOcrMinutes) {
        Start-Sleep -Seconds 60
        $waited++
        $pendingOcr = Get-OcrPendingCount
        Write-Log "Waiting for OCR: $pendingOcr tasks left (${waited} min elapsed)"
    }
    if ($pendingOcr -gt 0) {
        Write-Log "OCR did not finish in $MaxWaitOcrMinutes minutes. Aborting." "ERROR"
        exit 1
    }
    Write-Log "OCR finished, proceeding with import."
}

# 3. Set lock
$ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Set-Content -Path $LockFile -Value "locked at $ts by PID $PID" -Encoding UTF8
Write-Log "Lock file created."

try {
    # 4. Run import
    Write-Log "Running import:issues..."
    $importOutput = & php artisan import:issues "$ImportPath" 2>&1
    $importOutput | ForEach-Object { Write-Log "  [import] $_" }

    if ($LASTEXITCODE -ne 0) {
        throw "import:issues failed (exit code $LASTEXITCODE)."
    }
    Write-Log "Import finished."

    # Parse how many files were actually imported
    $importedLine = $importOutput | Select-String -Pattern 'Imported:\s*(\d+)' | Select-Object -Last 1
    $importedCount = 0
    if ($importedLine -and $importedLine.Matches.Groups[1].Value) {
        $importedCount = [int]$importedLine.Matches.Groups[1].Value
    }

    if ($importedCount -eq 0) {
        Write-Log "No new files imported - skipping queue processing."
    } else {
        # 5. Process queue (wait until all OCR/thumbnail jobs complete)
        Write-Log "Imported $importedCount file(s). Running queue:work --queue=default --stop-when-empty ..."
        $queueOutput = & php artisan queue:work --stop-when-empty --queue=default --tries=3 --timeout=600 2>&1
        $queueOutput | ForEach-Object { Write-Log "  [queue] $_" }
        Write-Log "Queue processed."

        # 6. Final stats
        $pendingAfter = Get-OcrPendingCount
        Write-Log "OCR tasks remaining in queue: $pendingAfter"
    }
    Write-Log "Auto-import completed successfully."

} catch {
    Write-Log "ERROR: $_" "ERROR"
} finally {
    # 7. Always remove lock — runs even on exit/throw
    if (Test-Path $LockFile) {
        Remove-Item $LockFile -Force
        Write-Log "Lock file removed."
    }
    Write-Log "========================================"
}