import { useState, useCallback, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useAccessibility } from "@/components/accessibility-provider";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
    ChevronLeft,
    ChevronRight,
    X,
    ZoomIn,
    ZoomOut,
    Maximize,
    Minimize,
    RotateCw,
    Loader2,
    FileText,
} from "lucide-react";

// PDF.js worker
// @ts-expect-error - worker import
import workerUrl from "pdfjs-dist/build/pdf.worker.min.js?url";
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

interface PdfViewerProps {
    fileUrl: string;
    onClose: () => void;
    title?: string;
}

// PDF options - full quality with background loading
const PDF_OPTIONS = {
    cMapUrl: "https://unpkg.com/pdfjs-dist@3.11.174/cmaps/",
    cMapPacked: true,
    // Enable range requests for fast first page
    disableRange: false,
    disableStream: false,
    // IMPORTANT: Enable auto-fetch so PDF downloads in background
    disableAutoFetch: false,
    rangeChunkSize: 65536 * 8, // 512KB chunks for faster background loading
    withCredentials: true,
};

// High DPI scale for crisp rendering (2x for retina, 3x for print quality)
const RENDER_SCALE = window.devicePixelRatio >= 2 ? 2 : 2; // Always render at 2x minimum

// Zoom limits - mobile devices need more zoom due to smaller screens
const MIN_SCALE = 0.5;
const MAX_SCALE = window.innerWidth < 768 ? 5 : 3; // 500% on mobile, 300% on desktop
const ZOOM_STEP = 0.25;

// Memory optimization: limit cached pages to reduce RAM usage
const MAX_CACHED_PAGES = 5;  // Keep max 5 pages in memory

export function PdfViewer({ fileUrl, onClose, title }: PdfViewerProps) {
    const { t } = useAccessibility();
    
    // Document state
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // View state - scale is now CSS-based, not re-render based
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    // Page rendering state - track which pages are rendered
    const [pageLoading, setPageLoading] = useState(true);
    const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());
    
    // Pages to keep in DOM (for caching) - includes current + cached neighbors
    const [cachedPages, setCachedPages] = useState<number[]>([1]);
    
    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<HTMLDivElement>(null);

    // Update cached pages list - add neighbors one by one after current page loads
    useEffect(() => {
        // Don't add more pages while current page is loading
        if (pageLoading || isLoading || numPages === 0) return;
        
        // Pages we want to have cached (in priority order)
        const desiredPages = [
            currentPage,
            currentPage + 1,
            currentPage - 1,
            currentPage + 2,
            currentPage - 2,
        ].filter(p => p >= 1 && p <= numPages);
        
        // Check if we need to add a new page to cache
        const missingPage = desiredPages.find(p => !cachedPages.includes(p));
        
        if (missingPage) {
            // Add one page at a time with a small delay to not block rendering
            const timer = setTimeout(() => {
                setCachedPages(prev => {
                    if (prev.includes(missingPage)) return prev;
                    // Limit cache size
                    const newCache = [...prev, missingPage];
                    if (newCache.length > MAX_CACHED_PAGES) {
                        // Remove pages that are far from current
                        return newCache
                            .map(p => ({ page: p, dist: Math.abs(p - currentPage) }))
                            .sort((a, b) => a.dist - b.dist)
                            .slice(0, MAX_CACHED_PAGES)
                            .map(x => x.page);
                    }
                    return newCache;
                });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [currentPage, numPages, pageLoading, isLoading, cachedPages]);

    // When changing pages, ensure current page is in cache
    useEffect(() => {
        if (!cachedPages.includes(currentPage)) {
            setCachedPages(prev => [...prev, currentPage]);
        }
    }, [currentPage]);

    // Calculate optimal width based on container
    const [pageWidth, setPageWidth] = useState(800);
    
    useEffect(() => {
        const updateWidth = () => {
            if (viewerRef.current) {
                const containerWidth = viewerRef.current.clientWidth;
                const containerHeight = viewerRef.current.clientHeight;
                // Use 90% of container width, max 1200px
                const optimalWidth = Math.min(containerWidth * 0.9, 1200);
                // For rotated pages, adjust
                if (rotation === 90 || rotation === 270) {
                    setPageWidth(Math.min(containerHeight * 0.85, optimalWidth));
                } else {
                    setPageWidth(optimalWidth);
                }
            }
        };
        
        updateWidth();
        window.addEventListener("resize", updateWidth);
        return () => window.removeEventListener("resize", updateWidth);
    }, [rotation]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                goToPrevPage();
            } else if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
                e.preventDefault();
                goToNextPage();
            } else if (e.key === "Escape") {
                onClose();
            } else if (e.key === "+" || e.key === "=") {
                zoomIn();
            } else if (e.key === "-") {
                zoomOut();
            }
        };
        
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentPage, numPages]);

    // Document handlers
    const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setIsLoading(false);
        setError(null);
    }, []);

    const onDocumentLoadError = useCallback((err: Error) => {
        console.error("PDF load error:", err);
        setIsLoading(false);
        setError(err.message || "Ошибка загрузки документа");
    }, []);

    const onPageLoadSuccess = useCallback(() => {
        setPageLoading(false);
        // Mark this page as rendered (cached)
        setRenderedPages(prev => new Set(prev).add(currentPage));
    }, [currentPage]);

    // Handler for preloaded pages - mark as rendered
    const onCachedPageRender = useCallback((pageNum: number) => {
        setRenderedPages(prev => new Set(prev).add(pageNum));
    }, []);

    // Navigation - check if page is already cached
    const goToNextPage = () => {
        if (currentPage < numPages) {
            const nextPage = currentPage + 1;
            // Only show loading if page is not cached
            if (!renderedPages.has(nextPage)) {
                setPageLoading(true);
            }
            setCurrentPage(nextPage);
        }
    };

    const goToPrevPage = () => {
        if (currentPage > 1) {
            const prevPage = currentPage - 1;
            // Only show loading if page is not cached
            if (!renderedPages.has(prevPage)) {
                setPageLoading(true);
            }
            setCurrentPage(prevPage);
        }
    };

    const goToPage = (page: number) => {
        if (page >= 1 && page <= numPages && page !== currentPage) {
            // Only show loading if page is not cached
            if (!renderedPages.has(page)) {
                setPageLoading(true);
            }
            setCurrentPage(page);
        }
    };

    // Zoom controls - CSS transform based, no re-render!
    const zoomIn = () => setScale(prev => Math.min(prev + ZOOM_STEP, MAX_SCALE));
    const zoomOut = () => setScale(prev => Math.max(prev - ZOOM_STEP, MIN_SCALE));
    const resetZoom = () => setScale(1);

    // Rotation
    const rotate = () => setRotation(prev => (prev + 90) % 360);

    // Fullscreen
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[100] flex flex-col bg-neutral-950"
        >
            {/* Top Bar */}
            <header className="flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-neutral-800">
                {/* Left: Title & Page Info */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-neutral-400">
                        <FileText className="h-5 w-5" />
                        {title && (
                            <span className="hidden sm:inline text-sm font-medium text-neutral-200 max-w-[200px] truncate">
                                {title}
                            </span>
                        )}
                    </div>
                    
                    {numPages > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-neutral-800"
                                onClick={goToPrevPage}
                                disabled={currentPage <= 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            
                            <div className="flex items-center gap-1 text-neutral-300">
                                <input
                                    type="number"
                                    min={1}
                                    max={numPages}
                                    value={currentPage}
                                    onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                                    className="w-12 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <span className="text-neutral-500">/</span>
                                <span>{numPages}</span>
                            </div>
                            
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-neutral-800"
                                onClick={goToNextPage}
                                disabled={currentPage >= numPages}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Center: Zoom Controls */}
                <div className="hidden md:flex items-center gap-2 bg-neutral-800 rounded-lg px-2 py-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-neutral-700"
                        onClick={zoomOut}
                        disabled={scale <= MIN_SCALE}
                    >
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    
                    <button
                        onClick={resetZoom}
                        className="text-sm text-neutral-300 hover:text-white w-14 text-center"
                    >
                        {Math.round(scale * 100)}%
                    </button>
                    
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-neutral-700"
                        onClick={zoomIn}
                        disabled={scale >= MAX_SCALE}
                    >
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                    
                    <div className="w-px h-6 bg-neutral-700 mx-1" />
                    
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-neutral-700"
                        onClick={rotate}
                    >
                        <RotateCw className="h-4 w-4" />
                    </Button>
                    
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-neutral-700"
                        onClick={toggleFullscreen}
                    >
                        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    </Button>
                </div>

                {/* Right: Close */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full"
                    onClick={onClose}
                >
                    <X className="h-5 w-5" />
                </Button>
            </header>

            {/* Main Viewer Area - container for PDF */}
            <div
                ref={viewerRef}
                className="flex-1 overflow-auto bg-neutral-900"
            >
                {/* Loading State - shown as overlay while PDF loads */}
                {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-neutral-900 z-20">
                        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                        <p className="text-neutral-400">{t("viewer.loading") || "Загрузка документа..."}</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="flex flex-col items-center justify-center h-full w-full gap-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                            <FileText className="h-8 w-8 text-red-500" />
                        </div>
                        <p className="text-red-400 font-medium">Ошибка загрузки</p>
                        <p className="text-neutral-500 text-sm max-w-md">{error}</p>
                        <Button variant="outline" onClick={onClose} className="mt-2">
                            Закрыть
                        </Button>
                    </div>
                )}

                {/* PDF Document - with proper sizing for scroll */}
                {!error && (
                    <div 
                        className="min-h-full min-w-full flex items-start justify-center p-4"
                        style={{
                            // When zoomed, this container expands to fit the zoomed content
                            // allowing proper scrolling in all directions
                            width: scale > 1 ? `max(100%, ${pageWidth * scale + 32}px)` : '100%',
                            minHeight: scale > 1 ? `max(100%, ${pageWidth * 1.414 * scale + 32}px)` : '100%',
                        }}
                    >
                        <Document
                            file={fileUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={onDocumentLoadError}
                            loading={null}
                            options={PDF_OPTIONS}
                        >
                            <div className="relative">
                                {/* Page Loading Overlay - only show if current page not cached */}
                                {pageLoading && !renderedPages.has(currentPage) && (
                                    <div 
                                        className="absolute flex items-center justify-center bg-neutral-800 z-10 rounded-lg"
                                        style={{ 
                                            width: pageWidth * scale, 
                                            height: pageWidth * 1.414 * scale,
                                            top: 0,
                                            left: 0 
                                        }}
                                    >
                                        {/* Skeleton loader */}
                                        <div 
                                            className="relative overflow-hidden bg-neutral-700 rounded"
                                            style={{ width: pageWidth * scale, height: pageWidth * 1.414 * scale }}
                                        >
                                            {/* Shimmer effect */}
                                            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-neutral-600/50 to-transparent" />
                                            
                                            {/* Content placeholder */}
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                                                <Loader2 className="h-10 w-10 animate-spin text-neutral-500" />
                                                <span className="text-neutral-500 text-sm">Загрузка страницы {currentPage}...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Render all cached pages - current visible, others hidden but kept in DOM */}
                                {cachedPages.map((pageNum) => {
                                    const isCurrent = pageNum === currentPage;
                                    return (
                                        <div
                                            key={pageNum}
                                            style={{ 
                                                // Only show current page, hide others (but keep in DOM!)
                                                display: isCurrent ? 'block' : 'none',
                                                width: pageWidth * scale,
                                                height: pageWidth * 1.414 * scale,
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <div
                                                style={{ 
                                                    transform: `scale(${scale / RENDER_SCALE})`,
                                                    transformOrigin: 'top left',
                                                    transition: isCurrent ? 'transform 0.15s ease-out' : 'none',
                                                }}
                                            >
                                                <Page
                                                    pageNumber={pageNum}
                                                    width={pageWidth * RENDER_SCALE}
                                                    rotate={rotation}
                                                    onLoadSuccess={isCurrent ? onPageLoadSuccess : undefined}
                                                    onRenderSuccess={() => {
                                                        if (isCurrent) {
                                                            onPageLoadSuccess();
                                                        } else {
                                                            onCachedPageRender(pageNum);
                                                        }
                                                    }}
                                                    renderAnnotationLayer={false}
                                                    renderTextLayer={false}
                                                    className={isCurrent ? "shadow-2xl rounded-sm" : ""}
                                                    canvasBackground="white"
                                                    loading={isCurrent ? (
                                                        <div 
                                                            className="relative overflow-hidden bg-neutral-700 rounded flex items-center justify-center"
                                                            style={{ width: pageWidth * RENDER_SCALE, height: pageWidth * RENDER_SCALE * 1.414 }}
                                                        >
                                                            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-neutral-600/50 to-transparent" />
                                                            <Loader2 className="h-10 w-10 animate-spin text-neutral-500" />
                                                        </div>
                                                    ) : null}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Document>
                    </div>
                )}
            </div>

            {/* Bottom Bar - Page Slider */}
            {numPages > 1 && !isLoading && !error && (
                <footer className="px-6 py-3 bg-neutral-900 border-t border-neutral-800">
                    <div className="max-w-2xl mx-auto flex items-center gap-4">
                        <span className="text-xs text-neutral-500 w-8">1</span>
                        <Slider
                            value={[currentPage]}
                            min={1}
                            max={numPages}
                            step={1}
                            onValueChange={([value]) => goToPage(value)}
                            className="flex-1"
                        />
                        <span className="text-xs text-neutral-500 w-8 text-right">{numPages}</span>
                    </div>
                </footer>
            )}

            {/* Mobile Controls Overlay */}
            <div className="md:hidden fixed bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-neutral-800/90 backdrop-blur rounded-full px-3 py-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-neutral-300 hover:text-white"
                    onClick={zoomOut}
                    disabled={scale <= MIN_SCALE}
                >
                    <ZoomOut className="h-5 w-5" />
                </Button>
                <span className="text-sm text-neutral-400 w-12 text-center">{Math.round(scale * 100)}%</span>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-neutral-300 hover:text-white"
                    onClick={zoomIn}
                    disabled={scale >= MAX_SCALE}
                >
                    <ZoomIn className="h-5 w-5" />
                </Button>
            </div>
        </div>
    );
}
