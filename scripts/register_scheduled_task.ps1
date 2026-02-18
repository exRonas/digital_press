<#
.SYNOPSIS
    Регистрирует задачу авто-импорта в Windows Task Scheduler.
    Запускать один раз с правами администратора.

.USAGE
    PowerShell -ExecutionPolicy Bypass -File register_scheduled_task.ps1

.PARAMETER ImportPath
    Папка с PDF-газетами (по умолчанию C:\zagr)

.PARAMETER Hour
    Час запуска (по умолчанию 22 — 10 вечера)
#>

param(
    [string]$ImportPath = "C:\zagr",
    [int]$Hour = 22
)

$TaskName    = "DigitalPress_AutoImport"
$ScriptPath  = Join-Path $PSScriptRoot "auto_import.ps1"
$PhpExe      = (Get-Command php -ErrorAction SilentlyContinue)?.Source

# Проверяем наличие php в PATH
if (-not $PhpExe) {
    Write-Error "PHP не найден в PATH. Убедитесь что PHP установлен и добавлен в PATH."
    exit 1
}

# Удаляем старую задачу если есть
if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "Старая задача '$TaskName' удалена." -ForegroundColor Yellow
}

# Действие: запуск PowerShell с нашим скриптом
$Action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$ScriptPath`" -ImportPath `"$ImportPath`""

# Триггер: каждый день в указанное время
$Trigger = New-ScheduledTaskTrigger -Daily -At "$($Hour):00"

# Настройки: запускать даже если на батарее, не останавливать при долгой работе
$Settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Hours 6) `
    -MultipleInstances IgnoreNew `
    -RunOnlyIfNetworkAvailable $false `
    -StartWhenAvailable `
    -WakeToRun $false

# Регистрируем задачу (от имени SYSTEM, чтобы не нужна была открытая сессия)
Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -RunLevel Highest `
    -Force | Out-Null

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Задача '$TaskName' зарегистрирована!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Расписание : каждый день в $($Hour):00" -ForegroundColor Cyan
Write-Host "  Скрипт     : $ScriptPath" -ForegroundColor Cyan
Write-Host "  Папка PDF  : $ImportPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Управление задачей:" -ForegroundColor Yellow
Write-Host "  Просмотр  : Get-ScheduledTask -TaskName '$TaskName'"
Write-Host "  Запустить : Start-ScheduledTask -TaskName '$TaskName'"
Write-Host "  Удалить   : Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false"
Write-Host ""
