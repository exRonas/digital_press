import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft, Loader2, Calendar, Newspaper, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { useTranslation } from "react-i18next"
import axios from "axios"

interface Publication {
  id: number
  title_ru: string
  title_kz: string | null
  slug: string
  history_ru: string | null
  history_kz: string | null
  issues_count: number
}

export function PublicationPage() {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const [publication, setPublication] = useState<Publication | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchPublication()
  }, [id])

  const fetchPublication = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await axios.get(`/publications/${id}`)
      setPublication(res.data)
    } catch (err) {
      console.error(err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const currentLanguage = i18n.language as "ru" | "kz"
  
  const getTitle = () => {
    if (!publication) return ""
    return currentLanguage === "kz" && publication.title_kz 
      ? publication.title_kz 
      : publication.title_ru
  }

  const getHistory = () => {
    if (!publication) return null
    // If language is KZ, return KZ history (even if null/empty) to avoid fallback to RU
    if (currentLanguage === "kz") {
      return publication.history_kz
    }
    // Default to RU
    return publication.history_ru
  }

  const history = getHistory()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Back Button */}
          <div className="mb-6">
            <Link to="/histories">
              <Button variant="ghost" className="gap-2 pl-0">
                <ArrowLeft className="h-4 w-4" />
                {t("publication.back_to_histories")}
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error || !publication ? (
            <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
              <Newspaper className="h-12 w-12 mb-4 opacity-50" />
              <p>{t("document.not_found")}</p>
              <Link to="/histories">
                <Button variant="link" className="mt-2">
                  {t("publication.back_to_histories")}
                </Button>
              </Link>
            </div>
          ) : (
            <article>
              {/* Header */}
              <header className="mb-8 border-b border-border pb-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h1 className="font-serif text-3xl font-bold text-foreground">
                      {getTitle()}
                    </h1>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <Badge variant="secondary" className="gap-1">
                        <Newspaper className="h-3 w-3" />
                        {publication.issues_count} {t("catalog.issue")}
                      </Badge>
                    </div>
                  </div>
                </div>
              </header>

              {/* History Section */}
              {history ? (
                <div className="prose prose-slate max-w-none dark:prose-invert">
                  <h2 className="font-serif text-xl font-semibold text-foreground mb-4">
                    {t("publication.history")}
                  </h2>
                  <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                    {history}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">
                    {t("publication.no_history")}
                  </p>
                </div>
              )}

              {/* Link to Catalog */}
              <div className="mt-8 rounded-lg border border-border bg-card p-6">
                <h3 className="font-semibold text-foreground mb-2">
                  {t("publication.view_issues")}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("publication.issues_available")}: {publication.issues_count}
                </p>
                <Link to={`/catalog?publication=${publication.id}`}>
                  <Button>
                    <Newspaper className="mr-2 h-4 w-4" />
                    {t("publication.go_to_catalog")}
                  </Button>
                </Link>
              </div>
            </article>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
