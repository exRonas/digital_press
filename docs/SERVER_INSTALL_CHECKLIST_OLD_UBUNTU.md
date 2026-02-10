# Установка на сервер: полная инструкция

Чеклист для продакшн‑развертывания системы **"Цифровой банк печати"** (Laravel + React + Nginx + OCR).

**Версия:** 2.0  
**Обновлено:** Январь 2026

---

## Содержание

1. [Требования к серверу](#1-требования-к-серверу)
2. [Установка пакетов](#2-установка-пакетов)
3. [Загрузка проекта](#3-загрузка-проекта)
4. [Настройка Backend (Laravel)](#4-настройка-backend-laravel)
5. [Настройка базы данных](#5-настройка-базы-данных)
6. [Настройка OCR](#6-настройка-ocr)
7. [Сборка Frontend](#7-сборка-frontend)
8. [Настройка Nginx](#8-настройка-nginx)
9. [Запуск очереди (Supervisor)](#9-запуск-очереди-supervisor)
10. [SSL сертификат](#10-ssl-сертификат)
11. [Финальная проверка](#11-финальная-проверка)
12. [Резервное копирование](#12-резервное-копирование)
13. [Обновление системы](#13-обновление-системы)
14. [Диагностика ошибок](#14-диагностика-ошибок)

---

## 1. Требования к серверу

| Компонент | Минимум | Рекомендуется |
|-----------|---------|---------------|
| CPU | 2 ядра | 4 ядра |
| RAM | 4 GB | 8 GB (для OCR) |
| Диск | 50 GB | 200 GB+ |
| ОС | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

---

## 2. Установка пакетов

```bash
sudo apt update && sudo apt upgrade -y

# PHP 8.2 + расширения
sudo apt install php8.2-fpm php8.2-cli php8.2-mbstring php8.2-xml \
  php8.2-curl php8.2-zip php8.2-pgsql php8.2-bcmath php8.2-gd

# Nginx
sudo apt install nginx

# PostgreSQL
sudo apt install postgresql postgresql-contrib

# OCR (Tesseract + Poppler)
sudo apt install tesseract-ocr tesseract-ocr-rus tesseract-ocr-kaz poppler-utils

# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs

# Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Supervisor (для очереди)
sudo apt install supervisor

# Утилиты
sudo apt install git unzip
```

### Проверка установки:
```bash
php -v           # PHP 8.2.x
nginx -v         # nginx/1.x
psql --version   # PostgreSQL 14+
tesseract -v     # tesseract 4.x или 5.x
pdftoppm -v      # poppler-utils
node -v          # v18.x
composer -V      # Composer 2.x
```

---

## 3. Загрузка проекта

```bash
# Создать директорию
sudo mkdir -p /var/www/digital-press
sudo chown $USER:$USER /var/www/digital-press
cd /var/www/digital-press

# Клонировать репозиторий
git clone https://your-repo-url.git .
# Или загрузить архив и распаковать
```

---

## 4. Настройка Backend (Laravel)

```bash
cd /var/www/digital-press/backend

# Установить зависимости
composer install --no-dev --optimize-autoloader

# Создать .env
cp .env.example .env
nano .env
```

### Настройки .env:

```env
APP_NAME="Цифровой банк печати"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.kz

# База данных
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=digital_press
DB_USERNAME=digital_press_user
DB_PASSWORD=СЛОЖНЫЙ_ПАРОЛЬ_МИНИМУМ_32_СИМВОЛА

# Очередь
QUEUE_CONNECTION=database

# OCR (пути для Ubuntu)
TESSERACT_PATH=/usr/bin/tesseract
POPPLER_PATH=/usr/bin
OCR_LANG=rus+kaz

# Сессии и кэш
SESSION_DRIVER=file
CACHE_DRIVER=file
```

### Продолжение настройки:

```bash
# Сгенерировать ключ приложения
php artisan key:generate

# Создать symbolic link для публичных файлов
php artisan storage:link

# Права доступа
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

---

## 5. Настройка базы данных

### Создать БД и пользователя:

```bash
sudo -u postgres psql
```

```sql
CREATE USER digital_press_user WITH PASSWORD 'ваш_сложный_пароль';
CREATE DATABASE digital_press OWNER digital_press_user;
GRANT ALL PRIVILEGES ON DATABASE digital_press TO digital_press_user;
\q
```

### Выполнить миграции:

```bash
cd /var/www/digital-press/backend

# Создать таблицы
php artisan migrate --force

# Создать администратора
php artisan db:seed --class=UserSeeder
```

**⚠️ Учётные данные по умолчанию:**
```
Логин: admin
Пароль: password
```
**ОБЯЗАТЕЛЬНО СМЕНИТЕ ПАРОЛЬ СРАЗУ ПОСЛЕ ВХОДА!**

---

## 6. Настройка OCR

OCR извлекает текст из PDF для полнотекстового поиска.

### Проверка Tesseract:

```bash
# Версия
tesseract --version

# Установленные языки (должны быть rus, kaz)
tesseract --list-langs

# Тест распознавания
tesseract test_image.png output -l rus+kaz
```

### Проверка Poppler:

```bash
# Версия
pdftoppm -v

# Тест конвертации PDF → изображение
pdftoppm -png -r 72 -f 1 -l 1 -singlefile test.pdf output
```

### Пути в .env (Ubuntu):

```env
TESSERACT_PATH=/usr/bin/tesseract
POPPLER_PATH=/usr/bin
OCR_LANG=rus+kaz
```

### Пути в .env (Windows):

```env
TESSERACT_PATH=C:/Program Files/Tesseract-OCR/tesseract.exe
POPPLER_PATH=C:/poppler/Library/bin
OCR_LANG=rus+kaz
```

> **Важно:** На Windows используйте ПРЯМЫЕ слеши `/` вместо обратных `\`

---

## 7. Сборка Frontend

```bash
cd /var/www/digital-press/frontend
npm install
npm run build
```

Результат: папка `frontend/dist/` с собранными файлами.

---

## 8. Настройка Nginx

### Скопировать конфиг:

```bash
sudo cp /var/www/digital-press/nginx/digital-press-production.conf \
        /etc/nginx/sites-available/digital-press

# Отредактировать домен
sudo nano /etc/nginx/sites-available/digital-press
```

### Изменить в конфиге:
- `server_name your-domain.kz;` — ваш домен
- Проверить пути к проекту

### Включить сайт:

```bash
sudo ln -s /etc/nginx/sites-available/digital-press /etc/nginx/sites-enabled/

# Удалить default сайт (опционально)
sudo rm /etc/nginx/sites-enabled/default

# Проверить конфигурацию
sudo nginx -t

# Перезагрузить
sudo systemctl reload nginx
```

---

## 9. Запуск очереди (Supervisor)

Очередь нужна для обработки OCR в фоновом режиме.

### Создать конфиг Supervisor:

```bash
sudo nano /etc/supervisor/conf.d/digital-press-worker.conf
```

```ini
[program:digital-press-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/digital-press/backend/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/digital-press/backend/storage/logs/worker.log
stopwaitsecs=3600
```

### Запустить:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start digital-press-worker:*

# Проверить статус
sudo supervisorctl status
```

---

## 10. SSL сертификат

### Let's Encrypt (бесплатно):

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.kz
```

### Автообновление:

```bash
# Проверить
sudo certbot renew --dry-run
```

Certbot автоматически добавляет задание в cron.

---

## 11. Финальная проверка

### ✅ Чеклист:

- [ ] Сайт открывается по HTTPS
- [ ] Каталог загружается, фильтры работают
- [ ] **Миниатюры газет отображаются**
- [ ] PDF открывается в просмотрщике
- [ ] PDF скачивается
- [ ] Вход в админку работает (`/admin`)
- [ ] Загрузка новых PDF работает
- [ ] После загрузки PDF создаётся миниатюра
- [ ] OCR запускается автоматически
- [ ] Поиск по тексту работает

### Проверка OCR:

```bash
# Статус воркера
sudo supervisorctl status

# Лог воркера
tail -f /var/www/digital-press/backend/storage/logs/worker.log

# Лог Laravel (OCR события)
tail -f /var/www/digital-press/backend/storage/logs/laravel.log | grep OCR
```

### Проверка статуса OCR в БД:

```bash
cd /var/www/digital-press/backend
php check_ocr_status.php
```

---

## 12. Резервное копирование

### Что бэкапить:

| Что | Путь | Важность |
|-----|------|----------|
| База данных | PostgreSQL dump | **Критично** |
| PDF файлы | `storage/app/public/issues/` | **Критично** |
| Миниатюры | `storage/app/public/thumbnails/` | Можно восстановить |
| Конфиг | `backend/.env` | **Критично** |

### Скрипт бэкапа:

```bash
#!/bin/bash
BACKUP_DIR="/backups/digital-press"
DATE=$(date +%Y-%m-%d)
mkdir -p $BACKUP_DIR

# БД
pg_dump -U digital_press_user digital_press > $BACKUP_DIR/db_$DATE.sql

# Файлы
rsync -av /var/www/digital-press/backend/storage/app/public/issues/ $BACKUP_DIR/pdfs/
rsync -av /var/www/digital-press/backend/storage/app/public/thumbnails/ $BACKUP_DIR/thumbnails/

# Конфиг
cp /var/www/digital-press/backend/.env $BACKUP_DIR/env_$DATE.backup

# Удалить старые (30 дней)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
```

### Добавить в cron (ежедневно в 3:00):

```bash
crontab -e
# Добавить:
0 3 * * * /opt/backup-digital-press.sh
```

---

## 13. Обновление системы

```bash
cd /var/www/digital-press

# Получить изменения
git pull origin main

# Backend
cd backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan cache:clear
php artisan config:clear

# Frontend
cd ../frontend
npm install
npm run build

# Перезапустить воркеры
sudo supervisorctl restart digital-press-worker:*

# Перезагрузить PHP-FPM (если изменился код)
sudo systemctl reload php8.2-fpm
```

---

## 14. Диагностика ошибок

### Логи:

```bash
# Nginx
sudo tail -f /var/log/nginx/error.log

# Laravel
tail -f /var/www/digital-press/backend/storage/logs/laravel.log

# Очередь
tail -f /var/www/digital-press/backend/storage/logs/worker.log

# PHP-FPM
sudo tail -f /var/log/php8.2-fpm.log
```

### Частые проблемы:

| Проблема | Решение |
|----------|---------|
| 403 Forbidden | `sudo chown -R www-data:www-data storage` |
| 500 Server Error | Проверить логи, права на `storage/` |
| PDF не открывается | Проверить `storage:link`, права на файлы |
| Миниатюры не показываются | `php artisan storage:link` |
| OCR не работает | Проверить `tesseract --list-langs`, статус воркера |
| Очередь не обрабатывает | `sudo supervisorctl restart digital-press-worker:*` |

### Очистка кэша:

```bash
cd /var/www/digital-press/backend
php artisan cache:clear
php artisan config:clear
php artisan view:clear
php artisan route:clear
```

### Права доступа:

```bash
sudo chown -R www-data:www-data /var/www/digital-press/backend/storage
sudo chown -R www-data:www-data /var/www/digital-press/backend/bootstrap/cache
sudo chmod -R 775 /var/www/digital-press/backend/storage
sudo chmod -R 775 /var/www/digital-press/backend/bootstrap/cache
```

---

## Быстрый старт (TL;DR)

```bash
# 1. Установить пакеты (см. раздел 2)
# 2. Клонировать проект
cd /var/www/digital-press/backend

# 3. Backend
composer install --no-dev
cp .env.example .env
nano .env  # Настроить БД, OCR пути
php artisan key:generate
php artisan migrate --force
php artisan db:seed --class=UserSeeder
php artisan storage:link
sudo chown -R www-data:www-data storage bootstrap/cache

# 4. Frontend
cd ../frontend
npm install && npm run build

# 5. Nginx
sudo cp ../nginx/digital-press-production.conf /etc/nginx/sites-available/digital-press
sudo ln -s /etc/nginx/sites-available/digital-press /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 6. Supervisor (очередь)
# Создать /etc/supervisor/conf.d/digital-press-worker.conf
sudo supervisorctl reread && sudo supervisorctl update

# 7. SSL
sudo certbot --nginx -d your-domain.kz

# 8. Войти: admin / password — СМЕНИТЬ ПАРОЛЬ!
```

---

*Версия: 2.0 | Январь 2026*
