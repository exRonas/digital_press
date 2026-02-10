import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAccessibility } from "@/components/accessibility-provider"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { NewspaperCard } from "@/components/newspaper-card"
import axios from "axios"

export function HomePage() {
  const { t } = useAccessibility()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")

  // Mock data for recent issues until API is fully ready
  const [recentIssues, setRecentIssues] = useState<any[]>([])

  useEffect(() => {
     axios.get('/issues?sort=date_desc&limit=6')
        .then(res => {
            // Transform server data to component props matches
            const mapped = res.data.data.map((issue: any) => ({
                id: issue.id,
                title: issue.publication.title_ru,
                date: issue.issue_date,
                number: issue.issue_number,
                language: issue.language,
                thumbnailUrl: issue.thumbnail_url,
            }));
            setRecentIssues(mapped);
        })
        .catch(err => console.error(err));
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(`/catalog?q=${encodeURIComponent(searchQuery)}`)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-border bg-muted/30 py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="mb-4 font-serif text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
              {t("hero.title")}
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-xl text-muted-foreground leading-relaxed text-pretty font-light">
              {t("hero.description")}
            </p>

            <form onSubmit={handleSearch} className="mx-auto max-w-2xl flex w-full items-center space-x-2 bg-background p-2 rounded-lg shadow-lg border">
                <Search className="h-5 w-5 text-muted-foreground ml-2" />
                <Input 
                   type="text" 
                   className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                   placeholder={t("search.placeholder") || "Поиск..."}
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button type="submit" size="lg">{t("search.button") || "Найти"}</Button>
            </form>
          </div>
        </section>

        {/* Recent Additions */}
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold font-serif">{t("recent.title") || "Свежие выпуски"}</h2>
                <Button variant="ghost" onClick={() => navigate('/catalog')}>
                    {t("recent.viewAll") || "Смотреть все"}
                </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {recentIssues.length > 0 ? recentIssues.map((issue) => (
                    <NewspaperCard 
                        key={issue.id}
                        id={issue.id}
                        title={issue.title}
                        date={issue.date}
                        issueNumber={issue.number}
                        language={issue.language}
                        thumbnailUrl={issue.thumbnailUrl}
                    />
                )) : (
                    <p className="text-muted-foreground col-span-full text-center py-10">
                        {t("recent.no_issues") || "Нет свежих выпусков"}
                    </p>
                )}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
