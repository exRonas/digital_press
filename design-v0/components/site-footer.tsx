"use client"

import { Newspaper } from "lucide-react"
import { useAccessibility } from "@/components/accessibility-provider"

export function SiteFooter() {
  const { t } = useAccessibility()

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary">
              <Newspaper className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-serif text-sm font-medium text-foreground">
                {t("site.title")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("footer.library")}
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {t("footer.copyright")}
          </p>
        </div>
      </div>
    </footer>
  )
}
