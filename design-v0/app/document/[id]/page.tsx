"use client"

import { use } from "react"
import Link from "next/link"
import {
  Calendar,
  ChevronRight,
  Download,
  FileText,
  Globe,
  Hash,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AccessibilityProvider,
  useAccessibility,
} from "@/components/accessibility-provider"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

// Mock data - in real app would fetch based on ID
const mockDocuments: Record<
  string,
  {
    id: string
    title: string
    date: string
    issueNumber: number
    language: "ru" | "kz"
    pdfUrl: string
  }
> = {
  "1": {
    id: "1",
    title: "Казахстанская правда",
    date: "2024-01-15",
    issueNumber: 2847,
    language: "ru",
    pdfUrl: "/sample.pdf",
  },
  "2": {
    id: "2",
    title: "Егемен Қазақстан",
    date: "2024-01-14",
    issueNumber: 1523,
    language: "kz",
    pdfUrl: "/sample.pdf",
  },
  "3": {
    id: "3",
    title: "Вечерний Алматы",
    date: "2024-01-13",
    issueNumber: 982,
    language: "ru",
    pdfUrl: "/sample.pdf",
  },
}

function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { t, language: uiLanguage } = useAccessibility()

  const document = mockDocuments[id] || mockDocuments["1"]

  const formattedDate = new Date(document.date).toLocaleDateString(
    document.language === "ru" ? "ru-RU" : "kk-KZ",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  )

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav
            className="mb-6 flex items-center gap-2 text-sm text-muted-foreground"
            aria-label="Breadcrumb"
          >
            <Link
              href="/"
              className="hover:text-foreground transition-colors"
            >
              {t("document.breadcrumb.home")}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link
              href="/catalog"
              className="hover:text-foreground transition-colors"
            >
              {t("document.breadcrumb.catalog")}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">{document.title}</span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[1fr,320px]">
            {/* PDF Viewer Area */}
            <div className="order-2 lg:order-1">
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  {/* PDF Viewer Placeholder */}
                  <div className="flex aspect-[3/4] w-full flex-col items-center justify-center bg-muted/50">
                    <FileText className="mb-4 h-16 w-16 text-muted-foreground" />
                    <p className="text-center text-muted-foreground">
                      PDF Viewer
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {document.title} — №{document.issueNumber}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Info */}
            <aside className="order-1 lg:order-2">
              <div className="sticky top-24 space-y-6">
                {/* Document Header */}
                <div>
                  <Badge
                    variant="secondary"
                    className="mb-3 text-xs font-medium uppercase"
                  >
                    {document.language === "ru" ? "Русский" : "Қазақша"}
                  </Badge>
                  <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl text-balance">
                    {document.title}
                  </h1>
                </div>

                {/* Metadata Card */}
                <Card>
                  <CardContent className="space-y-4 p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-muted">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {t("document.date")}
                        </p>
                        <p className="font-medium text-foreground">
                          {formattedDate}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-muted">
                        <Hash className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {t("document.issue")}
                        </p>
                        <p className="font-medium text-foreground">
                          №{document.issueNumber}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-muted">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {t("document.language")}
                        </p>
                        <p className="font-medium text-foreground">
                          {document.language === "ru" ? "Русский" : "Қазақша"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Download Button */}
                <Button size="lg" className="w-full gap-2">
                  <Download className="h-5 w-5" />
                  {t("document.download")}
                </Button>

                {/* Back to Catalog */}
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/catalog">{t("document.breadcrumb.catalog")}</Link>
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AccessibilityProvider>
      <DocumentPage params={params} />
    </AccessibilityProvider>
  )
}
