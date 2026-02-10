# Руководство по установке на Windows Server 2019

Полная инструкция по развертыванию системы **"Цифровой банк печати"** на сервере под управлением Windows Server 2019.

**Версия:** 3.0 (Windows Edition)  
**Обновлено:** Февраль 2026

---

## Содержание

1. [Предварительные требования](#1-предварительные-требования)
2. [Подготовка окружения и установка программ](#2-подготовка-окружения-и-установка-программ)
3. [Настройка переменных среды (PATH)](#3-настройка-переменных-среды-path)
4. [Установка компонентов OCR и PDF](#4-установка-компонентов-ocr-и-pdf)
5. [Развертывание кодовой базы](#5-развертывание-кодовой-базы)
6. [Настройка Базы Данных (PostgreSQL)](#6-настройка-базы-данных-postgresql)
7. [Настройка Backend](#7-настройка-backend)
8. [Сборка Frontend](#8-сборка-frontend)
9. [Настройка веб-сервера (Nginx)](#9-настройка-веб-сервера-nginx)
10. [Настройка автозапуска служб (NSSM)](#10-настройка-автозапуска-служб-nssm)

---

## 1. Предварительные требования

*   **ОС:** Windows Server 2019 (64-bit)
*   **CPU:** Минимум 4 ядра (для нормальной работы OCR)
*   **RAM:** Минимум 8 ГБ (OCR потребляет много памяти)
*   **Диск:** SSD, размер зависит от архива (рекомендуется от 200 ГБ)
*   **Права:** Администраторский доступ к серверу (RDP)

---

## 2. Подготовка окружения и установка программ

Все программы рекомендуется устанавливать в корень диска `C:\` или в `C:\Server\` для упрощения путей и избежания проблем с пробелами в `Program Files`.

### 2.1. Основные компоненты

1.  **PHP 8.2 или 8.3 (Non Thread Safe):**
    *   Скачать zip c [windows.php.net](https://windows.php.net/download/).
    *   Распаковать в `C:\php`.
    *   Переименовать `php.ini-production` в `php.ini`.
2.  **PostgreSQL 14+:**
    *   Скачать инсталлятор с [postgresql.org](https://www.postgresql.org/download/windows/).
    *   Установить. Запомнить пароль суперпользователя `postgres`.
3.  **Nginx:**
    *   Скачать stable версию с [nginx.org](https://nginx.org/en/download.html).
    *   Распаковать в `C:\nginx`.
4.  **Node.js (LTS):**
    *   Скачать и установить с [nodejs.org](https://nodejs.org/).
5.  **Git:**
    *   Скачать и установить с [git-scm.com](https://git-scm.com/).
6.  **Composer:**
    *   Скачать и установить `Composer-Setup.exe` с [getcomposer.org](https://getcomposer.org/).
7.  **Visual C++ Redistributable:**
    *   Установить последнюю версию (необходима для PHP и других библиотек).

---

## 3. Настройка переменных среды (PATH)

Добавьте следующие пути в системную переменную `Path` (Панель управления -> Система -> Дополнительные параметры системы -> Переменные среды):

*   `C:\php`
*   `C:\nginx`
*   `C:\Program Files\Git\cmd`
*   Путь к Composer (обычно добавляется автоматически)

**Включение расширений PHP:**
Откройте `C:\php\php.ini` и раскомментируйте (уберите `;`) следующие строки:
```ini
extension_dir = "ext"
extension=curl
extension=fileinfo
extension=gd
extension=mbstring
extension=openssl
extension=pdo_pgsql
extension=pgsql
```

Также настройте лимиты загрузки в `php.ini` (для больших PDF):
```ini
upload_max_filesize = 500M
post_max_size = 500M
memory_limit = 1024M
max_execution_time = 300
```

---

## 4. Установка компонентов OCR и PDF

Для работы сжатия и распознавания текста необходимы сторонние утилиты.

### 4.1. Ghostscript (для сжатия PDF)
1.  Скачать Windows (64 bit) версию c [ghostscript.com](https://www.ghostscript.com/releases/gsdnld.html).
2.  Установить.
3.  Найти путь к исполняемому файлу (обычно `C:\Program Files\gs\gs10.XX\bin\gswin64c.exe`).
4.  Добавить папку `bin` в **PATH**.

### 4.2. Tesseract OCR (для распознавания текста)
1.  Скачать инсталлятор (например, от UB-Mannheim) [github.com/UB-Mannheim/tesseract/wiki](https://github.com/UB-Mannheim/tesseract/wiki).
2.  Установить в `C:\Program Files\Tesseract-OCR` (или путь без пробелов, например `C:\Tesseract-OCR`).
3.  При установке **обязательно** выбрать языковые пакеты: **Russian**, **Kazakh** (если есть, иначе придется качать отдельно), **English**.
4.  Если языка нет в инсталляторе, скачать файлы `.traineddata` (rus, kaz, eng) и положить в папку `tessdata`.
5.  Добавить папку с `tesseract.exe` в **PATH**.

### 4.3. Poppler (для конвертации PDF в картинки)
1.  Скачать Windows-сборку (Release) с [github.com/oschwartz10612/poppler-windows/releases](https://github.com/oschwartz10612/poppler-windows/releases).
2.  Распаковать архив.
3.  Скопировать папку куда-нибудь, например в `C:\poppler`.
4.  Добавить путь `C:\poppler\bin` (где лежит `pdftoppm.exe`) в **PATH**.

**Проверка:**
Откройте **новый** PowerShell (от администратора) и проверьте команды:
```powershell
php -v
gswin64c --version
tesseract --version
pdftoppm -v
```
Все команды должны работать без ошибок.

---

## 5. Развертывание кодовой базы

Предположим, проект будет находиться в `C:\inetpub\digital_press`.

1.  Создайте папку:
    ```powershell
    mkdir C:\inetpub\digital_press
    cd C:\inetpub\digital_press
    ```
2.  Скопируйте файлы проекта (через Git clone или просто скопировав архив с файлами).

---

## 6. Настройка Базы Данных (PostgreSQL)

1.  Откройте pgAdmin 4 (устанавливается вместе с Postgres) или используйте консоль `psql`.
2.  Создайте пользователя и базу данных:
    ```sql
        CREATE USER box_user WITH PASSWORD 'VeryStr$ngP1assword';
        CREATE DATABASE digital_press OWNER box_user;
    ```
3.  Расширения для поиска (если требуются специфические словари, убедитесь, что они установлены).

---

## 7. Настройка Backend

1.  Перейдите в папку `backend`:
    ```powershell
    cd C:\inetpub\digital_press\backend
    ```
2.  Установите зависимости PHP:
    ```powershell
    composer install --optimize-autoloader --no-dev
    ```
3.  Настройте файл `.env`:
    ```powershell
    copy .env.example .env
    notepad .env
    ```
    *   Установите `APP_ENV=production`.
    *   Установите `APP_DEBUG=false`.
    *   Укажите `APP_URL=http://ваш-ip-адрес`.
    *   Настройте подключение к БД (`DB_USERNAME`, `DB_PASSWORD` из шага 6).
    *   **ВАЖНО:** Пропишите пути к утилитам (если они не в PATH или для надежности):
        ```dotenv
        GHOSTSCRIPT_PATH="C:\\Program Files\\gs\\gs10.04.0\\bin\\gswin64c.exe"
        TESSERACT_PATH="C:\\Program Files\\Tesseract-OCR\\tesseract.exe"
        POPPLER_PATH="C:\\poppler\\bin"
        ```
    *   Настройте диск для файлов на `public`:
        ```dotenv
        FILESYSTEM_DISK=public
        ```

4.  Сгенерируйте ключ и запустите миграции:
    ```powershell
    php artisan key:generate
    php artisan migrate --force
    php artisan storage:link
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    ```

---

## 8. Сборка Frontend

В этом проекте используется **автоматический скрипт** для сборки React-приложения и интеграции его в Laravel.

1.  Откройте PowerShell в корне проекта (где папки `scripts`, `frontend`, `backend`).
2.  Запустите скрипт сборки:
    ```powershell
    .\scripts\build_deploy.ps1
    ```
    *Что делает этот скрипт:*
    *   Собирает React проект (`npm run build`).
    *   Копирует JS/CSS файлы в `backend/public/assets`.
    *   Превращает `index.html` в `backend/resources/views/index.blade.php`.

    *Если скрипт прошел успешно (зеленые сообщения), переходите к следующему шагу.*

---

## 9. Настройка веб-сервера (Nginx)

1.  Откройте конфиг `C:\nginx\conf\nginx.conf`.
2.  В блоке `http {}` добавьте `include C:/inetpub/digital_press/nginx/digital-press-production.conf;` (или просто скопируйте содержимое конфига).
3.  Отредактируйте `digital-press-production.conf`:
    *   Исправьте пути `root` на абсолютные пути Windows, например: `C:/inetpub/digital_press/backend/public`.
    *   Обратите внимание на слеши: в Nginx используйте прямые слеши `/` даже на Windows.
4.  Проверьте конфиг:
    ```powershell
    C:\nginx\nginx.exe -t
    ```
5.  Запустите (или перезагрузите) Nginx:
    ```powershell
    start C:\nginx\nginx.exe
    # Или для перезагрузки
    C:\nginx\nginx.exe -s reload
    ```

---

## 10. Настройка автозапуска служб (NSSM)

Для того чтобы сайт работал после перезагрузки сервера, не запуская вручную консоли, используйте **NSSM** (Non-Sucking Service Manager).

1.  Скачайте NSSM [nssm.cc](https://nssm.cc/download).
2.  Распакуйте `win64/nssm.exe` в `C:\Windows\System32` (или в любую папку в PATH).

### 10.1. Служба PHP-CGI (обработка запросов)

```powershell
nssm install digital-press-php
```
В открывшемся окне:
*   **Path:** `C:\php\php-cgi.exe`
*   **Startup directory:** `C:\php`
*   **Arguments:** `-b 127.0.0.1:9000`
*   Нажмите **Install service**.

Запустите службу:
```powershell
nssm start digital-press-php
```

### 10.2. Служба Queue Worker (Сжатие и OCR)

Это критически важная служба для фоновой обработки файлов.

```powershell
nssm install digital-press-worker
```
В открывшемся окне:
*   **Path:** `C:\php\php.exe`
*   **Startup directory:** `C:\inetpub\digital_press\backend`
*   **Arguments:** `artisan queue:listen --tries=3 --timeout=600`
*   Нажмите **Install service**.

Запустите службу:
```powershell
nssm start digital-press-worker
```

### 10.3. Служба Nginx (если не установлен как служба)

Если вы просто распаковали Nginx, он не запускается сам. Установите его как службу:

```powershell
nssm install digital-press-nginx
```
*   **Path:** `C:\nginx\nginx.exe`
*   **Startup directory:** `C:\nginx`
*   **Install service**.
*   `nssm start digital-press-nginx`

---

## Проверка работоспособности

1.  Зайдите на `http://localhost` (или IP сервера).
2.  Попробуйте авторизоваться.
3.  **Тест загрузки:** Загрузите PDF газету.
4.  Проверьте `C:\inetpub\digital_press\backend\storage\logs\laravel.log` на наличие ошибок.
5.  Убедитесь, что файл появился на сайте через некоторое время (когда служба digital-press-worker обработает его).

---

## Частые проблемы на Windows

*   **Ошибка "File not found" при скачивании:**
    *   Проверьте, что в `.env` стоит `FILESYSTEM_DISK=public`.
    *   Проверьте, что выполнена команда `php artisan storage:link`.
*   **Ошибка OCR/Ghostscript:**
    *   Чаще всего дело в путях. Проверьте переменные `_PATH` в `.env`.
    *   Убедитесь, что пользователь, от имени которого запущена служба (обычно System), имеет права на чтение/запись в папку `storage` и `C:\Windows\Temp`.
*   **Долгая загрузка:**
    *   Увеличьте `upload_max_filesize` и `post_max_size` в `php.ini`.
    *   Увеличьте `client_max_body_size` в конфиге Nginx.
