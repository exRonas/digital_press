# X-Accel-Redirect File System Setup

This document explains the new PDF file serving system using Nginx X-Accel-Redirect.

## Проблема

При использовании `php artisan serve`:
- Встроенный PHP сервер однопоточный
- Большие PDF (50MB+) блокируют весь сервер
- Range Requests не поддерживаются (нужны для pdf.js)
- Сессии блокируются при длительной отдаче файлов

## Решение

**X-Accel-Redirect** — Laravel только проверяет права доступа, а Nginx отдаёт файл напрямую.

### Как это работает

```
1. React запрашивает: GET /api/issues/123/view
2. Laravel:
   - Проверяет авторизацию (Policy)
   - Возвращает пустой ответ с заголовками:
     X-Accel-Redirect: /_protected/private/pdfs/uuid.pdf
     Content-Type: application/pdf
3. Nginx:
   - Перехватывает X-Accel-Redirect
   - Отдаёт файл напрямую из storage/app/
   - Автоматически поддерживает Range Requests (206)
4. React получает PDF с полной поддержкой pdf.js
```

## Структура файлов

```
backend/
├── storage/app/
│   └── private/pdfs/          # Приватное хранилище PDF
│       └── 2026/
│           └── uuid.pdf
├── app/
│   ├── Models/File.php        # Модель файла
│   ├── Policies/FilePolicy.php # Политика доступа
│   └── Http/Controllers/
│       └── FileController.php  # Контроллер с X-Accel-Redirect
└── database/migrations/
    └── 2026_01_27_000001_create_files_table.php
```

## Установка

### 1. Запустить миграции

```bash
cd backend
php artisan migrate
```

### 2. Мигрировать существующие файлы (опционально)

```bash
# Сначала проверить что будет сделано
php artisan issues:migrate-files --dry-run

# Применить миграцию
php artisan issues:migrate-files
```

### 3. Установить Nginx

#### Windows (Laragon)

1. Laragon уже включает Nginx
2. Скопируйте конфиг:
   ```
   nginx/digital-press.conf → C:/laragon/etc/nginx/sites-enabled/
   ```
3. Отредактируйте пути в конфиге под вашу систему
4. Перезапустите Laragon

#### Windows (ручная установка)

1. Скачайте Nginx: https://nginx.org/en/download.html
2. Распакуйте в `C:/nginx`
3. Скопируйте конфиг в `C:/nginx/conf/nginx.conf`
4. Запустите: `C:/nginx/nginx.exe`

#### Linux

```bash
sudo apt install nginx
sudo cp nginx/digital-press-production.conf /etc/nginx/sites-available/digital-press
sudo ln -s /etc/nginx/sites-available/digital-press /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Настроить PHP-FPM

Nginx работает с PHP-FPM, не с `php artisan serve`.

```bash
# Windows (Laragon) - уже настроено
# Linux:
sudo apt install php8.2-fpm
sudo systemctl start php8.2-fpm
```

## Проверка

### curl тесты

```bash
# 1. Получить метаданные файла
curl -X GET http://localhost/api/files/1

# 2. Открыть файл (должен вернуть PDF)
curl -v -X GET http://localhost/api/files/1/open

# 3. Проверить Range Request (206 Partial Content)
curl -v -H "Range: bytes=0-1023" http://localhost/api/files/1/open

# 4. Через Issue API
curl -v http://localhost/api/issues/1/view
```

### Ожидаемые ответы

**Без Nginx (fallback):**
- Возвращает JSON `{ "url": "/storage/..." }`

**С Nginx (X-Accel-Redirect):**
- Возвращает PDF файл напрямую
- Headers: `Content-Type: application/pdf`, `Accept-Ranges: bytes`
- Range Request возвращает `206 Partial Content`

## API Endpoints

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/files` | GET | Список файлов |
| `/api/files/{id}` | GET | Метаданные файла |
| `/api/files/{id}/open` | GET | Открыть файл (X-Accel-Redirect) |
| `/api/files/{id}/download` | GET | Скачать файл (attachment) |
| `/api/files/{id}/url` | GET | Получить URL для фронтенда |
| `/api/files` | POST | Загрузить файл (auth required) |
| `/api/files/{id}` | DELETE | Удалить файл (auth required) |

## React интеграция

```tsx
// DocumentPage.tsx
const viewUrl = `/api/issues/${issue.id}/view`;

<FlipBookViewer 
    fileUrl={viewUrl}  // Nginx отдаст PDF напрямую
    onClose={() => setIsFullScreen(false)} 
/>
```

## Troubleshooting

### PDF не загружается

1. Проверьте что Nginx запущен:
   ```bash
   nginx -t
   curl http://localhost
   ```

2. Проверьте логи:
   ```bash
   # Windows
   cat C:/nginx/logs/error.log
   
   # Linux
   sudo tail -f /var/log/nginx/digital-press-error.log
   ```

3. Проверьте права на папку storage:
   ```bash
   # Linux
   sudo chown -R www-data:www-data storage/app/private
   sudo chmod -R 755 storage/app/private
   ```

### 403 Forbidden

- Проверьте FilePolicy - по умолчанию файлы публичны для issues
- Для приватных файлов нужна авторизация

### 404 Not Found

- Проверьте путь в `stored_path` в БД
- Убедитесь что файл существует: `ls -la storage/app/private/pdfs/`

### X-Accel-Redirect не работает

- Убедитесь что в Nginx есть `internal` директива для `/_protected/`
- Проверьте что alias указывает на правильную папку
- В dev режиме без Nginx - используется fallback JSON response

## Для продакшена

1. Используйте HTTPS
2. Настройте правильные права доступа
3. Включите gzip для статики
4. Настройте логирование
5. Используйте конфиг `nginx/digital-press-production.conf`
