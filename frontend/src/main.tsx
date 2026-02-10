import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './lib/i18n';
import { ThemeProvider } from "./components/theme-provider"
import { AccessibilityProvider } from "./components/accessibility-provider"

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <AccessibilityProvider>
        <App />
      </AccessibilityProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
