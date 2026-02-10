"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Loading from "./loading" // Import the Loading component
import {
  Download,
  Edit,
  Eye,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Mock data for documents
const mockDocuments = [
  {
    id: "1",
    title: "Казахстанская правда",
    date: "2024-01-15",
    issueNumber: 2847,
    language: "ru",
    views: 1243,
    downloads: 89,
  },
  {
    id: "2",
    title: "Егемен Қазақстан",
    date: "2024-01-14",
    issueNumber: 1523,
    language: "kz",
    views: 876,
    downloads: 45,
  },
  {
    id: "3",
    title: "Вечерний Алматы",
    date: "2024-01-13",
    issueNumber: 982,
    language: "ru",
    views: 654,
    downloads: 32,
  },
  {
    id: "4",
    title: "Астана Times",
    date: "2024-01-12",
    issueNumber: 445,
    language: "ru",
    views: 521,
    downloads: 28,
  },
  {
    id: "5",
    title: "Қазақ әдебиеті",
    date: "2024-01-11",
    issueNumber: 671,
    language: "kz",
    views: 432,
    downloads: 19,
  },
  {
    id: "6",
    title: "Экспресс К",
    date: "2024-01-10",
    issueNumber: 1289,
    language: "ru",
    views: 389,
    downloads: 22,
  },
  {
    id: "7",
    title: "Казахстанская правда",
    date: "2024-01-08",
    issueNumber: 2846,
    language: "ru",
    views: 1102,
    downloads: 67,
  },
  {
    id: "8",
    title: "Егемен Қазақстан",
    date: "2024-01-07",
    issueNumber: 1522,
    language: "kz",
    views: 798,
    downloads: 41,
  },
]

export default function AdminDocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState("all")
  const searchParams = useSearchParams()

  const filteredDocuments = mockDocuments.filter((doc) => {
    const matchesSearch = doc.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    const matchesLanguage =
      selectedLanguage === "all" || doc.language === selectedLanguage
    return matchesSearch && matchesLanguage
  })

  return (
    <Suspense fallback={<Loading />}> {/* Wrap the component in a Suspense boundary */}
      <div>
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">
              Документы
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Управление газетными выпусками в архиве
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link href="/admin/upload">
              <Plus className="h-4 w-4" />
              Загрузить выпуск
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Поиск по названию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Все языки" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все языки</SelectItem>
              <SelectItem value="ru">Русский</SelectItem>
              <SelectItem value="kz">Қазақша</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Documents Table */}
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Название</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>№ выпуска</TableHead>
                <TableHead>Язык</TableHead>
                <TableHead className="text-right">
                  <Eye className="inline-block h-4 w-4" />
                </TableHead>
                <TableHead className="text-right">
                  <Download className="inline-block h-4 w-4" />
                </TableHead>
                <TableHead className="w-[70px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.title}</TableCell>
                  <TableCell>
                    {new Date(doc.date).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>№{doc.issueNumber}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="text-xs font-medium uppercase"
                    >
                      {doc.language === "ru" ? "РУС" : "ҚАЗ"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {doc.views.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {doc.downloads}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Открыть меню</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2">
                          <Eye className="h-4 w-4" />
                          Просмотр
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Edit className="h-4 w-4" />
                          Редактировать
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <RefreshCw className="h-4 w-4" />
                          Повторить OCR
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4" />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Results count */}
        <p className="mt-4 text-sm text-muted-foreground">
          Показано {filteredDocuments.length} из {mockDocuments.length} документов
        </p>
      </div>
    </Suspense>
  )
}
