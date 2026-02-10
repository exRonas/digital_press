"use client"

import { Link } from "react-router-dom"
import { useAccessibility } from "@/components/accessibility-provider"

export function SiteFooter() {
  const { t } = useAccessibility()

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          
          {/* Logo */}
          <img src="/logo.png" alt="Logo" className="h-12 w-auto object-contain mb-2" />

          {/* Links Section */}
          <div className="flex flex-col gap-2 items-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {t("footer.copyright")} 
              <Link to="/admin/login" className="mx-1 text-inherit hover:text-foreground transition-colors" aria-label="Admin Access">
                •
              </Link>
              {t("footer.library")}
            </p>
            
            <Link 
              to="/histories" 
              className="text-sm font-medium text-foreground hover:text-primary transition-colors hover:underline underline-offset-4"
            >
              {t("footer.histories")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
