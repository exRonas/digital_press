"use client"

import { useState } from "react"
import { Filter, Grid3X3, List, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  AccessibilityProvider,
  useAccessibility,
} from "@/components/accessibility-provider"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { NewspaperCard } from "@/components/newspaper-card"

// Extended mock data
const mockNewspapers = [
  "Казахстанская правда",
  "Егемен Қазақстан",
  "Вечерний Алматы",
  "Астана Times",
  "Қазақ әдебиеті",
  "Экспресс К",
]

const mockIssues = [
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
  {
    id: "7",
    title: "Казахстанская правда",
    date: "2024-01-08",
    issueNumber: 2846,
    language: "ru" as const,
  },
  {
    id: "8",
    title: "Егемен Қазақстан",
    date: "2024-01-07",
    issueNumber: 1522,
    language: "kz" as const,
  },
  {
    id: "9",
    title: "Вечерний Алматы",
    date: "2024-01-06",
    issueNumber: 981,
    language: "ru" as const,
  },
]

function FilterSidebar({
  selectedNewspaper,
  setSelectedNewspaper,
  selectedLanguage,
  setSelectedLanguage,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  issueNumber,
  setIssueNumber,
  onReset,
}: {
  selectedNewspaper: string
  setSelectedNewspaper: (value: string) => void
  selectedLanguage: string
  setSelectedLanguage: (value: string) => void
  dateFrom: string
  setDateFrom: (value: string) => void
  dateTo: string
  setDateTo: (value: string) => void
  issueNumber: string
  setIssueNumber: (value: string) => void
  onReset: () => void
}) {
  const { t } = useAccessibility()

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="newspaper" className="mb-2 block text-sm font-medium">
          {t("filter.newspaper")}
        </Label>
        <Select value={selectedNewspaper} onValueChange={setSelectedNewspaper}>
          <SelectTrigger id="newspaper">
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
      </div>

      <div>
        <Label htmlFor="language" className="mb-2 block text-sm font-medium">
          {t("catalog.language")}
        </Label>
        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
          <SelectTrigger id="language">
            <SelectValue placeholder={t("catalog.allLanguages")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("catalog.allLanguages")}</SelectItem>
            <SelectItem value="ru">Русский</SelectItem>
            <SelectItem value="kz">Қазақша</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="dateFrom" className="mb-2 block text-sm font-medium">
          {t("filter.dateFrom")}
        </Label>
        <Input
          id="dateFrom"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="dateTo" className="mb-2 block text-sm font-medium">
          {t("filter.dateTo")}
        </Label>
        <Input
          id="dateTo"
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="issueNumber" className="mb-2 block text-sm font-medium">
          {t("catalog.issueNumber")}
        </Label>
        <Input
          id="issueNumber"
          type="number"
          placeholder="№"
          value={issueNumber}
          onChange={(e) => setIssueNumber(e.target.value)}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button variant="outline" onClick={onReset} className="flex-1 bg-transparent">
          {t("catalog.reset")}
        </Button>
      </div>
    </div>
  )
}

function CatalogPage() {
  const { t } = useAccessibility()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedNewspaper, setSelectedNewspaper] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [issueNumber, setIssueNumber] = useState("")
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const resetFilters = () => {
    setSelectedNewspaper("")
    setSelectedLanguage("")
    setDateFrom("")
    setDateTo("")
    setIssueNumber("")
  }

  // Filter logic
  const filteredIssues = mockIssues.filter((issue) => {
    if (selectedNewspaper && selectedNewspaper !== "all" && issue.title !== selectedNewspaper) {
      return false
    }
    if (selectedLanguage && selectedLanguage !== "all" && issue.language !== selectedLanguage) {
      return false
    }
    if (dateFrom && new Date(issue.date) < new Date(dateFrom)) {
      return false
    }
    if (dateTo && new Date(issue.date) > new Date(dateTo)) {
      return false
    }
    if (issueNumber && issue.issueNumber.toString() !== issueNumber) {
      return false
    }
    return true
  })

  const hasActiveFilters =
    selectedNewspaper || selectedLanguage || dateFrom || dateTo || issueNumber

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
              {t("catalog.title")}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {filteredIssues.length} {t("catalog.results")}
            </p>
          </div>

          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden w-64 shrink-0 lg:block">
              <div className="sticky top-24 rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 font-semibold text-foreground">
                  {t("catalog.filters")}
                </h2>
                <FilterSidebar
                  selectedNewspaper={selectedNewspaper}
                  setSelectedNewspaper={setSelectedNewspaper}
                  selectedLanguage={selectedLanguage}
                  setSelectedLanguage={setSelectedLanguage}
                  dateFrom={dateFrom}
                  setDateFrom={setDateFrom}
                  dateTo={dateTo}
                  setDateTo={setDateTo}
                  issueNumber={issueNumber}
                  setIssueNumber={setIssueNumber}
                  onReset={resetFilters}
                />
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="mb-6 flex items-center justify-between gap-4">
                {/* Mobile Filter Button */}
                <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="gap-2 lg:hidden bg-transparent">
                      <Filter className="h-4 w-4" />
                      {t("catalog.filters")}
                      {hasActiveFilters && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                          !
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80">
                    <SheetHeader>
                      <SheetTitle>{t("catalog.filters")}</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterSidebar
                        selectedNewspaper={selectedNewspaper}
                        setSelectedNewspaper={setSelectedNewspaper}
                        selectedLanguage={selectedLanguage}
                        setSelectedLanguage={setSelectedLanguage}
                        dateFrom={dateFrom}
                        setDateFrom={setDateFrom}
                        dateTo={dateTo}
                        setDateTo={setDateTo}
                        issueNumber={issueNumber}
                        setIssueNumber={setIssueNumber}
                        onReset={resetFilters}
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* View Mode Toggle */}
                <div className="ml-auto flex items-center gap-1 rounded-lg border border-border p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`rounded-md p-2 transition-colors ${
                      viewMode === "grid"
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    aria-label="Grid view"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`rounded-md p-2 transition-colors ${
                      viewMode === "list"
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    aria-label="List view"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Active Filters */}
              {hasActiveFilters && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {selectedNewspaper && selectedNewspaper !== "all" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm">
                      {selectedNewspaper}
                      <button
                        onClick={() => setSelectedNewspaper("")}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {selectedLanguage && selectedLanguage !== "all" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm">
                      {selectedLanguage === "ru" ? "Русский" : "Қазақша"}
                      <button
                        onClick={() => setSelectedLanguage("")}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {(dateFrom || dateTo) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm">
                      {dateFrom || "..."} — {dateTo || "..."}
                      <button
                        onClick={() => {
                          setDateFrom("")
                          setDateTo("")
                        }}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}

              {/* Results */}
              {filteredIssues.length > 0 ? (
                <div
                  className={
                    viewMode === "grid"
                      ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                      : "space-y-4"
                  }
                >
                  {filteredIssues.map((issue) => (
                    <NewspaperCard key={issue.id} {...issue} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
                  <p className="text-lg text-muted-foreground">
                    {t("catalog.noResults")}
                  </p>
                  <Button
                    variant="link"
                    onClick={resetFilters}
                    className="mt-2"
                  >
                    {t("catalog.reset")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

export default function Page() {
  return (
    <AccessibilityProvider>
      <CatalogPage />
    </AccessibilityProvider>
  )
}
