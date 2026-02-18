@echo off
chcp 65001 > nul
setlocal

:: ============================================================
::  clear_all_data.bat
::  Полная очистка данных: все газеты удаляются из БД и
::  из файлового хранилища.
::
::  Использование:
::    clear_all_data.bat           -- удалить выпуски, сохранить издания
::    clear_all_data.bat /pub      -- удалить выпуски + издания
:: ============================================================

cd /d "%~dp0..\backend"

set DELETE_PUB=0
if /i "%1"=="/pub" set DELETE_PUB=1

echo.
echo ============================================================
echo   ПОЛНАЯ ОЧИСТКА ДАННЫХ -- УДАЛЕНИЕ ВСЕХ ГАЗЕТ
echo ============================================================
echo.
echo  Будут удалены:
echo    - Все выпуски (issues)
echo    - Все файлы (files) и записи в таблице files
echo    - Все результаты OCR (ocr_results)
echo    - Все статистики просмотров (issue_stats)
echo    - Все физические файлы PDF и миниатюры из storage\
if "%DELETE_PUB%"=="1" (
    echo    - Все издания ^(publications^)  [флаг /pub активен]
) else (
    echo.
    echo  НЕ будут удалены:
    echo    - Издания ^(publications^)  [запустите с /pub чтобы удалить тоже]
    echo    - Пользователи
)
echo.
echo ============================================================
echo  ВНИМАНИЕ: ОПЕРАЦИЯ НЕОБРАТИМА!
echo ============================================================
echo.

set CONFIRM1=
set /p CONFIRM1="Введите YES для продолжения: "
if /i not "%CONFIRM1%"=="YES" (
    echo.
    echo Операция отменена.
    pause
    exit /b 0
)

echo.
set CONFIRM2=
set /p CONFIRM2="Последнее подтверждение -- введите DELETE: "
if /i not "%CONFIRM2%"=="DELETE" (
    echo.
    echo Операция отменена.
    pause
    exit /b 0
)

echo.
echo Запускаем Artisan-команду...
echo.

if "%DELETE_PUB%"=="1" (
    php artisan press:clear-all --force --publications
) else (
    php artisan press:clear-all --force
)

if errorlevel 1 (
    echo.
    echo [ОШИБКА] Команда завершилась с ошибкой. Проверьте вывод выше.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  Готово! Все данные успешно удалены.
echo ============================================================
echo.
pause
