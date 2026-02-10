"use client"

import { Link } from "react-router-dom"
import { Download, Eye, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAccessibility } from "@/components/accessibility-provider"
import { useState } from "react"

interface NewspaperCardProps {
  id: string
  title: string
  date: string
  issueNumber: number
  language: string
  thumbnailUrl?: string | null
}

export function NewspaperCard({
  id,
  title,
  date,
  issueNumber,
  language,
  thumbnailUrl,
}: NewspaperCardProps) {
  const { t, language: interfaceLanguage } = useAccessibility()
  const [imageError, setImageError] = useState(false)

  const dateObj = new Date(date);
  const month = dateObj.getMonth(); // 0-11
  const day = dateObj.getDate();
  const year = dateObj.getFullYear();
  
  const monthKeys = [
    "months.january", "months.february", "months.march", "months.april",
    "months.may", "months.june", "months.july", "months.august",
    "months.september", "months.october", "months.november", "months.december"
  ];
  
  const monthName = t(monthKeys[month]);
  
  const formattedDate = interfaceLanguage === "kz" 
      ? `${day} ${monthName} ${year} ж.`
      : dateObj.toLocaleDateString("ru", { year: "numeric", month: "long", day: "numeric" }); 

  const showThumbnail = thumbnailUrl && !imageError

  return (
    <Card className="flex flex-col transition-all hover:shadow-lg overflow-hidden group">
      {/* Thumbnail - full width at top */}
      <Link to={`/document/${id}`} className="relative aspect-[3/4] bg-muted overflow-hidden">
        {showThumbnail ? (
          <img 
            src={thumbnailUrl} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <FileText className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
        {/* Language badge overlay */}
        <Badge
          variant="secondary"
          className="absolute top-2 right-2 text-xs font-medium uppercase bg-background/90 backdrop-blur-sm"
        >
          {language === "ru" ? "РУС" : language === "kz" ? "ҚАЗ" : language}
        </Badge>
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="flex items-center gap-2 text-white font-medium">
            <Eye className="h-5 w-5" />
            {t("catalog.view")}
          </div>
        </div>
      </Link>

      {/* Info section */}
      <CardContent className="flex-1 p-4">
        <h3 className="mb-2 line-clamp-2 font-serif text-base font-semibold leading-tight text-foreground">
          {title}
        </h3>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{formattedDate}</span>
          <span>№{issueNumber}</span>
        </div>
      </CardContent>

      {/* Action buttons */}
      <CardFooter className="flex gap-2 border-t border-border p-3 pt-3">
        <Button asChild variant="default" size="sm" className="flex-1 gap-2">
          <Link to={`/document/${id}`}>
            <Eye className="h-4 w-4" />
            {t("catalog.view")}
          </Link>
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
          <Download className="h-4 w-4" />
          <span className="sr-only">{t("catalog.download")}</span>
        </Button>
      </CardFooter>
    </Card>
  )
}
