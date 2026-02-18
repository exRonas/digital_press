<#
.SYNOPSIS
    Автоматический ночной импорт газет.
    Запускается по расписанию (Task Scheduler) в 22:00.
    Не стартует, если предыдущий импорт ещё не обработан очередью OCR.

.DESCRIPTION
    1. Проверяет lock-файл — если он есть, предыдущий запуск ещё работает, выходим.
    2. Проверяет очередь OCR (ocr_results со статусом queued/processing) — если есть, ждём.
    3. Создаёт lock-файл.
    4. Запускает import:issues --no-interaction.
    5. Запускает queue:work --stop-when-empty (ждёт пока всё обработается).
    6. Удаляет lock-файл.
    7. Всё логируется в logs\auto_import.log
#>

param (
    [string]$ImportPath = "C:\zagr"
)

# ── НАСТРОЙКИ ────────────────────────────────────────────────
$BackendDir = Join-Path $PSScriptRoot "..\backend"
$LockFile   = Join-Path $PSScriptRoot "auto_import.lock"
$LogFile    = Join-Path $PSScriptRoot "..\backend\storage\logs\auto_import.log"
$MaxWaitOcrMinutes = 120   # Максимальное время ожидания обработки OCR (мин)
# ─────────────────────────────────────────────────────────────

# Убеждаемся что директория логов существует
if (-not (Test-Path (Split-Path $LogFile))) {
    New-Item -ItemType Directory -Path (Split-Path $LogFile) -Force | Out-Null
}

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$timestamp] [$Level] $Message"
    Add-Content -Path $LogFile -Value $line -Encoding UTF8
    Write-Host $line
}

function Get-OcrPendingCount {
    # Спрашиваем у Laravel сколько задач ещё в обработке
    $result = & php artisan tinker --no-ansi --execute="echo DB::table('ocr_results')->whereIn('status',['queued','processing'])->count();" 2>$null |
              Select-String -Pattern '^\d+$' | Select-Object -Last 1
    if ($result) { return [int]$result.ToString().Trim() }
    return 0
}

# ── СТАРТ ────────────────────────────────────────────────────
Set-Location $BackendDir

Write-Log "========================================"
Write-Log "Авто-импорт запущен. Папка: $ImportPath"

# 1. Проверка lock-файла
if (Test-Path $LockFile) {
    $lockAge = (Get-Date) - (Get-Item $LockFile).LastWriteTime
    if ($lockAge.TotalHours -lt 8) {
        Write-Log "Lock-файл существует (создан $([int]$lockAge.TotalMinutes) мин назад). Предыдущий запуск ещё работает — выходим." "WARN"
        exit 0
    } else {
        Write-Log "Lock-файл устарел (>8 часов), удаляем и продолжаем." "WARN"
        Remove-Item $LockFile -Force
    }
}

# 2. Проверка — остались ли необработанные OCR-задачи с прошлого раза
$pendingOcr = Get-OcrPendingCount
if ($pendingOcr -gt 0) {
    Write-Log "Найдено $pendingOcr задач OCR в статусе queued/processing. Ждём завершения перед новым импортом..." "WARN"
    $waited = 0
    while ($pendingOcr -gt 0 -and $waited -lt $MaxWaitOcrMinutes) {
        Start-Sleep -Seconds 60
        $waited++
        $pendingOcr = Get-OcrPendingCount
        Write-Log "Ожидание OCR: осталось $pendingOcr задач (прошло ${waited} мин)"
    }
    if ($pendingOcr -gt 0) {
        Write-Log "OCR не завершился за $MaxWaitOcrMinutes минут. Прерываем — попробуем в следующий раз." "ERROR"
        exit 1
    }
    Write-Log "OCR завершён, продолжаем импорт."
}

# 3. Устанавливаем lock
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Set-Content -Path $LockFile -Value "locked at $timestamp by PID $PID" -Encoding UTF8
Write-Log "Lock-файл создан."

try {
    # 4. Запуск импорта
    Write-Log "Запускаем import:issues..."
    $importOutput = & php artisan import:issues "$ImportPath" 2>&1
    $importOutput | ForEach-Object { Write-Log "  [import] $_" }

    if ($LASTEXITCODE -ne 0) {
        Write-Log "import:issues завершился с ошибкой (code $LASTEXITCODE)." "ERROR"
        exit 1
    }
    Write-Log "Импорт завершён."

    # 5. Обработка очереди (ждём пока все задачи OCR/thumbnail выполнятся)
    Write-Log "Запускаем queue:work --stop-when-empty (ждём обработки OCR и миниатюр)..."
    $queueOutput = & php artisan queue:work --stop-when-empty --tries=3 --timeout=600 2>&1
    $queueOutput | ForEach-Object { Write-Log "  [queue] $_" }

    Write-Log "Очередь обработана."

    # 6. Итоговая статистика
    $pendingAfter = Get-OcrPendingCount
    Write-Log "Осталось задач OCR в очереди: $pendingAfter"
    Write-Log "Авто-импорт успешно завершён."

} catch {
    Write-Log "Непредвиденная ошибка: $_" "ERROR"
    exit 1
} finally {
    # 7. Всегда снимаем lock
    if (Test-Path $LockFile) {
        Remove-Item $LockFile -Force
        Write-Log "Lock-файл удалён."
    }
    Write-Log "========================================"
}
