# Digital Press

A digital archive and press viewing system.

## Project Structure

- **frontend/**: React SPA with Vite and Tailwind CSS.
- **backend/**: Laravel API backend.
- **design-v0/**: Next.js prototype/design system components.
- **docs/**: Documentation and guides.
- **scripts/**: Utility scripts for backup and startup.
- **nginx/**: Nginx configuration files.

## Getting Started

Refer to `docs/SERVER_INSTALL_CHECKLIST.md` or `docs/OPERATOR_GUIDE.md` for detailed instructions.

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
composer install
php artisan serve
```
