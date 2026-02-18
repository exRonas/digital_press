@echo off
chcp 65001 > nul
setlocal

:: --- НАСТРОЙКИ ---
:: Укажите здесь путь к папке, где лежат ваши газеты PDF
set IMPORT_PATH=C:\zagr

:: Переходим в папку бэкенда
cd /d "%~dp0..\backend"

echo.
echo ==========================================
echo    STARTING MASS IMPORT OF NEWSPAPERS
echo ==========================================
echo Target Folder: %IMPORT_PATH%
echo.

:: 1. Сначала запускаем проверку (DRY RUN) - без сохранения в базу
echo [1/2] Running DRY RUN (Test mode)...
php artisan import:issues "%IMPORT_PATH%" --dry-run

echo.
echo ------------------------------------------
echo Check the output above.
echo If titles, dates and numbers are correct, press any key to START REAL IMPORT.
echo If there are errors, close this window.
echo ------------------------------------------
pause

:: 2. Запускаем реальный импорт
echo.
echo [2/2] IMPORTING FILES TO DATABASE...
php artisan import:issues "%IMPORT_PATH%"

echo.
echo ==========================================
echo    IMPORT FINISHED!
echo ==========================================
echo Now running background worker to process OCR and Thumbnails...
echo (You can close this window if the worker is already running elsewhere)
php artisan queue:work --stop-when-empty

pause
