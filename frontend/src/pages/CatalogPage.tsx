// Placeholder for catalog page
import { useState, useEffect } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Filter, Grid3X3, List, Search, ChevronLeft, ChevronRight, Loader2, BookOpen } from "lucide-react"
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
import { NewspaperCard } from "@/components/newspaper-card"
import { useTranslation } from "react-i18next";
import { useAccessibility } from "@/components/accessibility-provider"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import axios from "axios"

interface Publication {
    id: number;
    title_ru: string;
    title_kz?: string;
    description_ru?: string;
    description_kz?: string;
}

interface Issue {
    id: number;
    issue_number: string;
    issue_date: string;
    language: 'ru' | 'kz' | 'mix';
    publication: Publication;
    file_id?: number | null;
    ocr_status?: string;
    thumbnail_url?: string | null;
}

interface Meta {
    current_page: number;
    last_page: number;
    total: number;
}

interface SidebarFiltersProps {
    t: any;
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    selectedNewspaperId: string;
    setSelectedNewspaperId: (val: string) => void;
    publications: Publication[];
    selectedYear: string;
    setSelectedYear: (val: string) => void;
    availableYears: string[];
    selectedMonth: string;
    setSelectedMonth: (val: string) => void;
    setPage: (val: number) => void;
}

const SidebarFilters = ({
    t,
    searchQuery,
    setSearchQuery,
    selectedNewspaperId,
    setSelectedNewspaperId,
    publications,
    selectedYear,
    setSelectedYear,
    availableYears,
    selectedMonth,
    setSelectedMonth,
    setPage
}: SidebarFiltersProps) => {
    const { language } = useAccessibility();
    
    const handleFilterChange = (setter: (val: string) => void, value: string) => {
        setter(value);
        setPage(1);
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label>{t("catalog.search", {defaultValue: "Поиск"})}</Label>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder={t("catalog.search_placeholder", {defaultValue: "Название или номер..."})}
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
            
            <div className="space-y-2">
                <Label>{t("catalog.newspaper", {defaultValue: "Издание"})}</Label>
                <Select value={selectedNewspaperId} onValueChange={(v) => handleFilterChange(setSelectedNewspaperId, v)}>
                    <SelectTrigger>
                        <SelectValue placeholder={t("catalog.select_newspaper", {defaultValue: "Выберите издание"})}/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("filter.allNewspapers", {defaultValue: "Все издания"})}</SelectItem>
                        {publications.map((news) => (
                             <SelectItem key={news.id} value={news.id.toString()}>
                                {language === 'kz' && news.title_kz ? news.title_kz : news.title_ru}
                             </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {selectedNewspaperId !== "all" && (
                    <Link 
                        to={`/publication/${selectedNewspaperId}`}
                        className="flex items-center gap-1.5 text-sm text-primary hover:underline mt-2"
                    >
                        <BookOpen className="h-4 w-4" />
                        {t("publication.history", {defaultValue: "История издания"})}
                    </Link>
                )}
            </div>
            
            <div className="space-y-2">
                <Label>{t("catalog.year", {defaultValue: "Год"})}</Label>
                <Select value={selectedYear} onValueChange={(v) => handleFilterChange(setSelectedYear, v)}>
                     <SelectTrigger>
                        <SelectValue placeholder={t("catalog.select_year", {defaultValue: "Выберите год"})} />
                    </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="all">{t("catalog.all_years", {defaultValue: "Все годы"})}</SelectItem>
                        {availableYears.map(y => (
                            <SelectItem key={y} value={y}>{y}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            
             <div className="space-y-2">
                <Label>{t("catalog.month", {defaultValue: "Месяц"})}</Label>
                <Select value={selectedMonth} onValueChange={(v) => handleFilterChange(setSelectedMonth, v)}>
                     <SelectTrigger>
                        <SelectValue placeholder={t("catalog.select_month", {defaultValue: "Выберите месяц"})} />
                    </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="all">{t("catalog.all_months", {defaultValue: "Все месяцы"})}</SelectItem>
                        <SelectItem value="1">{t("months.january", {defaultValue: "Январь"})}</SelectItem>
                        <SelectItem value="2">{t("months.february", {defaultValue: "Февраль"})}</SelectItem>
                        <SelectItem value="3">{t("months.march", {defaultValue: "Март"})}</SelectItem>
                        <SelectItem value="4">{t("months.april", {defaultValue: "Апрель"})}</SelectItem>
                        <SelectItem value="5">{t("months.may", {defaultValue: "Май"})}</SelectItem>
                        <SelectItem value="6">{t("months.june", {defaultValue: "Июнь"})}</SelectItem>
                        <SelectItem value="7">{t("months.july", {defaultValue: "Июль"})}</SelectItem>
                        <SelectItem value="8">{t("months.august", {defaultValue: "Август"})}</SelectItem>
                        <SelectItem value="9">{t("months.september", {defaultValue: "Сентябрь"})}</SelectItem>
                        <SelectItem value="10">{t("months.october", {defaultValue: "Октябрь"})}</SelectItem>
                        <SelectItem value="11">{t("months.november", {defaultValue: "Ноябрь"})}</SelectItem>
                        <SelectItem value="12">{t("months.december", {defaultValue: "Декабрь"})}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                    setSearchQuery("")
                    setSelectedNewspaperId("all")
                    setSelectedYear("all")
                    setSelectedMonth("all")
                    setPage(1)
                }}
            >
                {t("catalog.reset", {defaultValue: "Сбросить фильтры"})}
            </Button>
        </div>
    );
};

export default function CatalogPage() {
    const { t, language } = useAccessibility();
    const [searchParams] = useSearchParams();
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
    
    // Data state
    const [issues, setIssues] = useState<Issue[]>([]);
    const [publications, setPublications] = useState<Publication[]>([]);
    const [availableYears, setAvailableYears] = useState<string[]>([]); // New state
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState<Meta | null>(null);

    // Filters state
    const initialQuery = searchParams.get("q") || "";
    const [searchQuery, setSearchQuery] = useState(initialQuery)
    const [debouncedSearch, setDebouncedSearch] = useState(initialQuery)
    const [selectedNewspaperId, setSelectedNewspaperId] = useState<string>("all")
    const [selectedYear, setSelectedYear] = useState<string>("all")
    const [selectedMonth, setSelectedMonth] = useState<string>("all")
    const [page, setPage] = useState(1);
    
    // Fetch Publications and Years
    useEffect(() => {
        axios.get<Publication[]>('/publications')
            .then(res => setPublications(res.data))
            .catch(err => console.error(err));

        axios.get<string[]>('/issues/years')
            .then(res => setAvailableYears(res.data.map(String)))
            .catch(err => console.error("Failed to fetch years", err));
    }, []);

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1); // Reset page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Construct Date Range and Fetch Issues
    useEffect(() => {
        const fetchIssues = async () => {
            setLoading(true);
            try {
                const params: any = {
                    page: page,
                    sort: 'date_desc'
                };

                if (debouncedSearch) {
                    params.search = debouncedSearch;
                }

                if (selectedNewspaperId !== "all") {
                    params.publication_id = selectedNewspaperId;
                }

                if (selectedYear !== "all") {
                    params.year = selectedYear;
                }

                if (selectedMonth !== "all") {
                    params.month = selectedMonth;
                }

                const res = await axios.get('/issues', { params });
                setIssues(res.data.data);
                setMeta({
                    current_page: res.data.current_page,
                    last_page: res.data.last_page,
                    total: res.data.total
                });
            } catch (error) {
                console.error("Failed to fetch issues", error);
            } finally {
                setLoading(false);
            }
        };

        fetchIssues();
    }, [page, debouncedSearch, selectedNewspaperId, selectedYear, selectedMonth]);

    return (
        <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                     <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                             <h1 className="font-serif text-3xl font-bold text-foreground">
                                {t("catalog.title", {defaultValue: "Каталог изданий"})}
                            </h1>
                            <p className="mt-1 text-muted-foreground">
                                {t("catalog.subtitle")}
                            </p>
                        </div>
                        
                         <div className="flex items-center gap-2">
                            <div className="hidden items-center rounded-md border p-1 sm:flex">
                                <Button
                                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                                  size="sm"
                                  className="gap-2"
                                  onClick={() => setViewMode("grid")}
                                >
                                  <Grid3X3 className="h-4 w-4" />
                                  <span className="sr-only">{t("catalog.view_grid", {defaultValue: "Сетка"})}</span>
                                </Button>
                                <Button
                                  variant={viewMode === "list" ? "secondary" : "ghost"}
                                  size="sm"
                                  className="gap-2"
                                  onClick={() => setViewMode("list")}
                                >
                                  <List className="h-4 w-4" />
                                  <span className="sr-only">{t("catalog.view_list", {defaultValue: "Список"})}</span>
                                </Button>
                            </div>

                             <Sheet>
                                <SheetTrigger asChild>
                                  <Button variant="outline" size="sm" className="gap-2 lg:hidden">
                                    <Filter className="h-4 w-4" />
                                    {t("catalog.filters", {defaultValue: "Фильтры"})}
                                  </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-[85vw] max-w-[400px] overflow-y-auto">
                                  <SheetHeader>
                                    <SheetTitle className="font-serif">
                                        {t("catalog.filters", {defaultValue: "Фильтры"})}
                                    </SheetTitle>
                                  </SheetHeader>
                                  <div className="mt-4">
                                    <SidebarFilters 
                                        t={t}
                                        searchQuery={searchQuery}
                                        setSearchQuery={setSearchQuery}
                                        selectedNewspaperId={selectedNewspaperId}
                                        setSelectedNewspaperId={setSelectedNewspaperId}
                                        publications={publications}
                                        selectedYear={selectedYear}
                                        setSelectedYear={setSelectedYear}
                                        availableYears={availableYears}
                                        selectedMonth={selectedMonth}
                                        setSelectedMonth={setSelectedMonth}
                                        setPage={setPage}
                                    />
                                  </div>
                                </SheetContent>
                              </Sheet>
                        </div>
                     </div>
                     
                     <div className="grid gap-8 lg:grid-cols-4">
                        {/* Desktop Sidebar */}
                        <div className="hidden lg:block">
                            <div className="sticky top-24 rounded-lg border bg-card p-6 shadow-sm">
                                <SidebarFilters 
                                    t={t}
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    selectedNewspaperId={selectedNewspaperId}
                                    setSelectedNewspaperId={setSelectedNewspaperId}
                                    publications={publications}
                                    selectedYear={selectedYear}
                                    setSelectedYear={setSelectedYear}
                                    availableYears={availableYears}
                                    selectedMonth={selectedMonth}
                                    setSelectedMonth={setSelectedMonth}
                                    setPage={setPage}
                                />
                            </div>
                        </div>
                        
                        {/* Main Grid */}
                        <div className="lg:col-span-3">
                            <div className="flex justify-end mb-4">
                                <span className="text-sm text-muted-foreground">
                                    {meta ? `${t('catalog.showing', {defaultValue: "Показано"})} ${issues.length} ${t('catalog.of', {defaultValue: "из"})} ${meta.total}` : ''}
                                </span>
                            </div>

                            {loading ? (
                                <div className="flex h-64 items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <>
                                    <div className={`grid gap-6 ${
                                        viewMode === 'grid' 
                                        ? 'sm:grid-cols-2 lg:grid-cols-3' 
                                        : 'grid-cols-1'
                                    }`}>
                                        {issues.map((issue) => (
                                            <NewspaperCard 
                                                key={issue.id}
                                                id={issue.id.toString()}
                                                title={
                                                    (language === 'kz' && issue.publication?.title_kz) 
                                                        ? issue.publication.title_kz 
                                                        : (issue.publication?.title_ru || 'Unknown')
                                                }
                                                date={issue.issue_date}
                                                issueNumber={parseInt(issue.issue_number) || 0}
                                                language={issue.language}
                                                thumbnailUrl={issue.thumbnail_url}
                                            />
                                        ))}
                                    </div>
                                    
                                    {issues.length === 0 && (
                                        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed text-center">
                                            <h3 className="font-serif text-lg font-medium">
                                                {t("catalog.noResults", {defaultValue: "Ничего не найдено"})}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {t("catalog.try_changing_filters", {defaultValue: "Попробуйте изменить параметры поиска"})}
                                            </p>
                                        </div>
                                    )}

                                    {/* Pagination */}
                                    {meta && meta.last_page > 1 && (
                                        <div className="mt-8 flex items-center justify-center space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(page - 1)}
                                                disabled={page === 1}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <div className="text-sm">
                                                {page} / {meta.last_page}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(page + 1)}
                                                disabled={page === meta.last_page}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                     </div>
                </div>
            <SiteFooter />
            </main>
        </div>
    )
}
