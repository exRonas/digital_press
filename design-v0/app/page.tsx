"use client"

import React, { Suspense } from "react"
import { useSearchParams } from "next/navigation"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AccessibilityProvider, useAccessibility } from "@/components/accessibility-provider"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { NewspaperCard } from "@/components/newspaper-card"

// Mock data for demonstration
const mockNewspapers = [
  "Казахстанская правда",
  "Егемен Қазақстан",
  "Вечерний Алматы",
  "Астана Times",
]

const mockRecentIssues = [
  {
    id: "1",
    title: "Казахстанская правда",
    date: "2024-01-15",
    issueNumber: 2847,
    language: "ru" as const,
  },
  {
    id: "2",
    title: "Егемен Қазақстан",
    date: "2024-01-14",
    issueNumber: 1523,
    language: "kz" as const,
  },
  {
    id: "3",
    title: "Вечерний Алматы",
    date: "2024-01-13",
    issueNumber: 982,
    language: "ru" as const,
  },
  {
    id: "4",
    title: "Астана Times",
    date: "2024-01-12",
    issueNumber: 445,
    language: "ru" as const,
  },
  {
    id: "5",
    title: "Қазақ әдебиеті",
    date: "2024-01-11",
    issueNumber: 671,
    language: "kz" as const,
  },
  {
    id: "6",
    title: "Экспресс К",
    date: "2024-01-10",
    issueNumber: 1289,
    language: "ru" as const,
  },
]

function HomePage() {
  const { t } = useAccessibility()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedNewspaper, setSelectedNewspaper] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Navigate to catalog with search params
    window.location.href = `/catalog?q=${encodeURIComponent(searchQuery)}&newspaper=${encodeURIComponent(selectedNewspaper)}`
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-border bg-muted/30 py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="mb-4 font-serif text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl text-balance">
              {t("hero.title")}
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground leading-relaxed text-pretty">
              {t("hero.description")}
            </p>

            {/* Search Form */}
            <form
              onSubmit={handleSearch}
              className="mx-auto max-w-2xl space-y-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={t("search.placeholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 pl-10 text-base"
                  />
                </div>
                <Button type="submit" size="lg" className="h-12 px-8">
                  {t("search.button")}
                </Button>
              </div>

              {/* Quick Filters */}
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Select
                  value={selectedNewspaper}
                  onValueChange={setSelectedNewspaper}
                >
                  <SelectTrigger className="h-10 w-full sm:w-64">
                    <SelectValue placeholder={t("filter.allNewspapers")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filter.allNewspapers")}</SelectItem>
                    {mockNewspapers.map((newspaper) => (
                      <SelectItem key={newspaper} value={newspaper}>
                        {newspaper}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Input
                    type="date"
                    className="h-10 w-36"
                    aria-label={t("filter.dateFrom")}
                  />
                  <span className="flex items-center text-muted-foreground">—</span>
                  <Input
                    type="date"
                    className="h-10 w-36"
                    aria-label={t("filter.dateTo")}
                  />
                </div>
              </div>
            </form>
          </div>
        </section>

        {/* Recently Added Section */}
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">
                {t("recent.title")}
              </h2>
              <Button asChild variant="ghost" className="gap-2">
                <Link href="/catalog">
                  {t("recent.viewAll")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mockRecentIssues.map((issue) => (
                <NewspaperCard key={issue.id} {...issue} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

function Loading() {
  return null
}

export default function Page() {
  return (
    <AccessibilityProvider>
      <Suspense fallback={<Loading />}>
        <HomePage />
      </Suspense>
    </AccessibilityProvider>
  )
}
