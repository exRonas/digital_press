import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: true,
    proxy: {
      // API proxy - now pointing to Nginx (port 80) instead of php artisan serve (8000)
      // Nginx handles PHP-FPM and X-Accel-Redirect for PDFs
      '/api': {
        target: 'http://localhost:80',
        changeOrigin: true,
        secure: false,
      },
      // Storage proxy for thumbnails and other public files
      '/storage': {
        target: 'http://localhost:80',
        changeOrigin: true,
        secure: false,
      },
    }
  },
  preview: {
    proxy: {
      '/api': {
        target: 'http://localhost:80',
        changeOrigin: true,
        secure: false,
      },
      '/storage': {
        target: 'http://localhost:80',
        changeOrigin: true,
        secure: false,
      },
    }
  }
})
