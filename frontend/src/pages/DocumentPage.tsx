import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import {
  Calendar,
  ChevronRight,
  Download,
  FileText,
  Globe,
  Hash,
  BookOpen
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAccessibility } from "@/components/accessibility-provider"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import axios from "@/lib/axios"
import { Skeleton } from "@/components/ui/skeleton"
import { PdfViewer } from "@/components/pdf-viewer/PdfViewer"

interface Issue {
    id: number;
    issue_number: string;
    issue_date: string;
    language: 'ru' | 'kz' | 'other';
    file_id?: number;  // New file system
    thumbnail_url?: string | null;
    file?: {
        id: number;
        original_name: string;
        size: number;
    };
    publication: {
        title_ru: string;
        title_kz?: string;
    };
    stats: {
        views_count: number;
        downloads_count: number;
    }
}

export default function DocumentPage() {
    const { id } = useParams<{ id: string }>();
    const { t, language } = useAccessibility();
    const navigate = useNavigate();
    
    const [issue, setIssue] = useState<Issue | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showViewer, setShowViewer] = useState(false);

    useEffect(() => {
        if (!id) return;
        
        axios.get(`/issues/${id}`)
            .then(res => setIssue(res.data))
            .catch(err => {
                console.error(err);
                setError(t("document.not_found") || "Документ не найден");
            })
            .finally(() => setLoading(false));

    }, [id]);
    
    if (loading) {
        return (
            <div className="flex min-h-screen flex-col bg-background">
                <SiteHeader />
                <main className="flex-1 flex items-center justify-center">
                    <div className="space-y-4 text-center">
                        <Skeleton className="h-12 w-12 rounded-full mx-auto" />
                        <Skeleton className="h-4 w-[200px]" />
                    </div>
                </main>
            </div>
        )
    }

    if (error || !issue) {
        return (
            <div className="flex h-[50vh] items-center justify-center flex-col">
                 <div className="text-center">
                    <h2 className="text-2xl font-bold">{error}</h2>
                    <Button onClick={() => navigate('/catalog')} className="mt-4">
                        {t("document.breadcrumb.catalog") || "Вернуться в каталог"}
                    </Button>
                 </div>
            </div>
        )
    }
    
    const dateObj = new Date(issue.issue_date);
    const monthIndex = dateObj.getMonth();
    const day = dateObj.getDate();
    const year = dateObj.getFullYear();

    const monthKeys = [
        "months.january", "months.february", "months.march", "months.april",
        "months.may", "months.june", "months.july", "months.august",
        "months.september", "months.october", "months.november", "months.december"
    ];

    const formattedDate = language === "kz"
        ? `${day} ${t(monthKeys[monthIndex])} ${year} ж.`
        : dateObj.toLocaleDateString("ru-RU", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

    const title = issue.publication.title_ru; // TODO: handle language switcher for title
    
    const viewUrl = `/api/issues/${issue.id}/view`;
    const downloadUrl = `/api/issues/${issue.id}/download`;

    return (
        <div className="flex min-h-screen flex-col bg-background">
             {/* PDF Viewer Modal */}
             {showViewer && (
                <PdfViewer
                    fileUrl={viewUrl}
                    onClose={() => setShowViewer(false)}
                    title={`${title} — № ${issue.issue_number}`}
                />
             )}
             
             <SiteHeader />
             <main className="flex-1">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    {/* Breadcrumb */}
                    <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
                        <Link to="/" className="hover:text-foreground transition-colors">{t("document.breadcrumb.home") || "Главная"}</Link>
                        <ChevronRight className="h-4 w-4" />
                        <Link to="/catalog" className="hover:text-foreground transition-colors">{t("document.breadcrumb.catalog") || "Каталог"}</Link>
                         <ChevronRight className="h-4 w-4" />
                         <span className="font-medium text-foreground truncate max-w-[200px]" title={title}>{title}</span>
                    </nav>
                    
                        {/* Centered Meta Card */}
                        <div className="mx-auto w-full max-w-3xl">
                            <Card className="overflow-hidden border-none shadow-lg">
                                <div className="flex flex-col md:flex-row">
                                    {/* Thumbnail Section */}
                                    <div 
                                        className="w-full md:w-1/3 aspect-[3/4] bg-muted relative group cursor-pointer overflow-hidden"
                                        onClick={() => setShowViewer(true)}
                                    >
                                         {issue.thumbnail_url ? (
                                            <img 
                                                src={issue.thumbnail_url} 
                                                alt={title}
                                                className="absolute inset-0 w-full h-full object-cover"
                                            />
                                         ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
                                                <FileText className="h-20 w-20" />
                                            </div>
                                         )}
                                         <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="flex flex-col items-center gap-2 text-white">
                                                <BookOpen className="h-10 w-10" />
                                                <span className="text-sm font-medium">{t("document_read_online")}</span>
                                            </div>
                                         </div>
                                    </div>

                                    {/* Content Section */}
                                    <CardContent className="flex-1 p-8 flex flex-col justify-between">
                                        <div>
                                            <h1 className="mb-6 font-serif text-3xl font-bold leading-tight text-foreground">
                                                {title}
                                            </h1>
                                            
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3 text-muted-foreground">
                                                    <Calendar className="h-5 w-5" />
                                                    <span className="text-lg">{formattedDate}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-muted-foreground">
                                                    <Hash className="h-5 w-5" />
                                                    <span className="text-lg">№ {issue.issue_number}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-muted-foreground">
                                                    <Globe className="h-5 w-5" />
                                                    <span className="text-lg">{issue.language === "ru" ? t("language.ru") : t("language.kz")}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-8 space-y-4">
                                            <div className="flex gap-6 text-sm text-muted-foreground border-t pt-4">
                                                <span>{t("document.views")}: {issue.stats?.views_count || 0}</span>
                                                <span>{t("document.downloads")}: {issue.stats?.downloads_count || 0}</span>
                                            </div>
                                            
                                            <div className="flex gap-4 pt-2">
                                                <Button 
                                                    size="lg" 
                                                    className="flex-1 gap-2" 
                                                    onClick={() => setShowViewer(true)}
                                                >
                                                    <BookOpen className="h-5 w-5" />
                                                    {t("document_read_online")}
                                                </Button>
                                                <Button size="lg" variant="outline" className="gap-2" asChild>
                                                    <a href={downloadUrl} download>
                                                        <Download className="h-5 w-5" />
                                                        PDF
                                                    </a>
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </div>
                            </Card>
                        </div>
                </div>
             </main>
             <SiteFooter />
        </div>
    )
}
