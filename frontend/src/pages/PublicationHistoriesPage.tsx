import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { BookOpen, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { useTranslation } from "react-i18next"
import axios from "axios"

interface Publication {
  id: number
  title_ru: string
  title_kz: string | null
  history_ru: string | null
  history_kz: string | null
  issues_count: number
}

export function PublicationHistoriesPage() {
  const { t, i18n } = useTranslation()
  const [publications, setPublications] = useState<Publication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPublications()
  }, [])

  const fetchPublications = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/publications')
      setPublications(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const currentLanguage = i18n.language as "ru" | "kz"

  const historyList = publications.filter(pub => {
     if (currentLanguage === "kz") {
        return pub.history_kz && pub.history_kz.trim().length > 0
     }
     return pub.history_ru && pub.history_ru.trim().length > 0
  })

  // Extract a preview of the history (first 150 chars)
  const getHistoryPreview = (pub: Publication) => {
    // Force specific language content based on current language
    // Do NOT fallback to RU if KZ is selected but empty (though filter should prevent empty ones)
    if (currentLanguage === "kz") {
        return pub.history_kz
    }
    return pub.history_ru
  }

  const getTitle = (pub: Publication) => {
    return currentLanguage === "kz" && pub.title_kz ? pub.title_kz : pub.title_ru
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="font-serif text-3xl font-bold text-foreground">
                    {t("footer.histories")}
                </h1>
                <p className="mt-2 text-muted-foreground">
                    {t("publication.histories_description")}
                </p>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : historyList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <BookOpen className="h-16 w-16 text-muted-foreground/30 mb-6" />
                    <h2 className="text-xl font-semibold mb-2">
                        {currentLanguage === "kz" ? "Мәлімет жоқ" : "Пока нет историй"}
                    </h2>
                    <p className="text-muted-foreground max-w-md">
                        {currentLanguage === "kz" 
                            ? "Әзірге ешқандай басылым тарихы қосылмаған." 
                            : "К сожалению, истории изданий еще не добавлены."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {historyList.map(pub => (
                        <Card key={pub.id} className="flex flex-col hover:shadow-md transition-shadow">
                            <CardHeader>
                                <CardTitle className="font-serif">
                                    {getTitle(pub)}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed">
                                    {(() => {
                                        const text = getHistoryPreview(pub);
                                        if (!text) return "";
                                        return text.length > 200 ? text.substring(0, 200) + "..." : text;
                                    })()}
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Button asChild variant="ghost" className="w-full justify-between group">
                                    <Link to={`/publication/${pub.id}`}>
                                        {t("publication.read_more")}
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
