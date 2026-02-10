"use client"

import Link from "next/link"
import { Download, Eye, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAccessibility } from "@/components/accessibility-provider"

interface NewspaperCardProps {
  id: string
  title: string
  date: string
  issueNumber: number
  language: "ru" | "kz"
}

export function NewspaperCard({
  id,
  title,
  date,
  issueNumber,
  language,
}: NewspaperCardProps) {
  const { t } = useAccessibility()

  const formattedDate = new Date(date).toLocaleDateString(
    language === "ru" ? "ru-RU" : "kk-KZ",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  )

  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardContent className="flex-1 p-4 sm:p-6">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <Badge
            variant="secondary"
            className="shrink-0 text-xs font-medium uppercase"
          >
            {language === "ru" ? "РУС" : "ҚАЗ"}
          </Badge>
        </div>

        <h3 className="mb-2 line-clamp-2 font-serif text-lg font-semibold leading-tight text-foreground">
          {title}
        </h3>

        <div className="space-y-1 text-sm text-muted-foreground">
          <p>{formattedDate}</p>
          <p>
            {t("catalog.issue")} №{issueNumber}
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 border-t border-border p-4">
        <Button asChild variant="default" size="sm" className="flex-1 gap-2">
          <Link href={`/document/${id}`}>
            <Eye className="h-4 w-4" />
            {t("catalog.view")}
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Download className="h-4 w-4" />
          <span className="sr-only">{t("catalog.download")}</span>
        </Button>
      </CardFooter>
    </Card>
  )
}
