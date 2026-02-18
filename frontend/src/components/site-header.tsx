"use client"

import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useAccessibility } from "@/components/accessibility-provider"

export function SiteHeader() {
  const { language, setLanguage, t } =
    useAccessibility()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="h-16 w-auto object-contain" />
          <div className="hidden sm:block">
            <h1 className="font-serif text-2xl font-semibold leading-tight text-foreground">
              {t("site.subtitle")}
            </h1>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Language Switcher */}
          <div className="flex items-center rounded-sm border border-border">
            <button
              onClick={() => setLanguage("ru")}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                language === "ru"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Русский язык"
            >
              RU
            </button>
            <button
              onClick={() => setLanguage("kz")}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                language === "kz"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Қазақ тілі"
            >
              KZ
            </button>
          </div>


          {/* Accessibility Toggle - Removed */}
        </div>
      </div>
    </header>
  )
}
