"use client"

import { Link } from "react-router-dom"
import { useAccessibility } from "@/components/accessibility-provider"

export function SiteFooter() {
  const { t } = useAccessibility()

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          
          {/* Social Links */}

          {/* Links Section */}
          <div className="flex flex-col gap-2 items-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {t("footer.copyright")} 
              <Link to="/admin/login" className="mx-1 text-inherit hover:text-foreground transition-colors" aria-label="Admin Access">
                •
              </Link>
              {t("footer.library")}
            </p>
            
          <div className="flex items-center gap-4">
            <a href="https://www.tiktok.com/@pavlodarlibrary" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="TikTok">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
            </a>
            <a href="https://www.instagram.com/toraigyrov_kitapkhanasy" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
            <a href="https://www.facebook.com/pavlodarlibrary" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Facebook">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="https://www.youtube.com/@pavlodarounb" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="YouTube">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
            </a>
            <a href="https://t.me/PavlodarBibliotekaBot" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Telegram">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.6 3.6L2.4 11.2c-.9.3-.9 1.4 0 1.7l5 1.5 11.5-7.2c.5-.3.8-.1.7.2L11 16.5l-1 4.5c-.1.5.6.7.9.4l2.5-2.2 4.6 3.4c.8.6 2 .2 2.2-.8l3.9-18.4c.3-1.4-1.2-2.3-2.5-1.8z"/></svg>
            </a>
          </div>
            {/* <Link 
              to="/histories" 
              className="text-sm font-medium text-foreground hover:text-primary transition-colors hover:underline underline-offset-4"
            >
              {t("footer.histories")}
            </Link> */}
          </div>
        </div>
      </div>
    </footer>
  )
}
