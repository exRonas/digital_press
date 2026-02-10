import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  Download,
  Eye,
  Plus,
  Search,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import axios from "@/lib/axios"

interface Publication {
  id: number;
  title_ru: string;
  title_kz?: string;
}

interface Issue {
  id: number;
  issue_number: string;
  issue_date: string;
  language: 'ru' | 'kz' | 'mix';
  publication_id: number;
  publication: Publication;
  stats?: {
    views_count: number;
    downloads_count: number;
  };
}

interface Meta {
  current_page: number;
  last_page: number;
  total: number;
}

export function AdminDocumentsPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState<Meta | null>(null)
  const [page, setPage] = useState(1)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState("all")
  
  // Edit Dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null)
  const [editForm, setEditForm] = useState({
    issue_number: "",
    issue_date: "",
    language: "",
  })
  const [saving, setSaving] = useState(false)
  
  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingIssue, setDeletingIssue] = useState<Issue | null>(null)
  const [deleting, setDeleting] = useState(false)
  
  const { toast } = useToast()

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch issues
  useEffect(() => {
    const fetchIssues = async () => {
      setLoading(true)
      try {
        const params: any = { page }
        if (debouncedSearch) params.search = debouncedSearch
        if (selectedLanguage !== "all") params.language = selectedLanguage

        const res = await axios.get('/admin/issues', { params })
        setIssues(res.data.data)
        setMeta({
          current_page: res.data.current_page,
          last_page: res.data.last_page,
          total: res.data.total,
        })
      } catch (err) {
        console.error(err)
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить документы",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchIssues()
  }, [page, debouncedSearch, selectedLanguage])

  const handleEdit = (issue: Issue) => {
    setEditingIssue(issue)
    setEditForm({
      issue_number: issue.issue_number,
      issue_date: issue.issue_date,
      language: issue.language,
    })
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingIssue) return
    setSaving(true)
    try {
      await axios.put(`/admin/issues/${editingIssue.id}`, editForm)
      toast({
        title: "Сохранено",
        description: "Документ успешно обновлен",
      })
      setEditDialogOpen(false)
      // Refresh list
      setIssues(issues.map(i => 
        i.id === editingIssue.id 
          ? { ...i, ...editForm, language: editForm.language as any } 
          : i
      ))
    } catch (err: any) {
      toast({
        title: "Ошибка",
        description: err.response?.data?.message || "Не удалось сохранить",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (issue: Issue) => {
    setDeletingIssue(issue)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingIssue) return
    setDeleting(true)
    try {
      await axios.delete(`/admin/issues/${deletingIssue.id}`)
      toast({
        title: "Удалено",
        description: "Документ успешно удален",
      })
      setDeleteDialogOpen(false)
      setIssues(issues.filter(i => i.id !== deletingIssue.id))
    } catch (err: any) {
      toast({
        title: "Ошибка",
        description: err.response?.data?.message || "Не удалось удалить",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleRetryOcr = async (issue: Issue) => {
    try {
      await axios.post(`/admin/issues/${issue.id}/ocr`)
      toast({
        title: "OCR запущен",
        description: "Распознавание текста поставлено в очередь",
      })
    } catch (err: any) {
      toast({
        title: "Ошибка",
        description: err.response?.data?.message || "Не удалось запустить OCR",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU')
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            Документы
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Управление газетными выпусками в архиве
            {meta && ` • Всего: ${meta.total}`}
          </p>
        </div>
        <Button asChild className="gap-2 w-full sm:w-auto">
          <Link to="/admin/upload">
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
        <Select value={selectedLanguage} onValueChange={(v) => { setSelectedLanguage(v); setPage(1); }}>
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

      {/* Documents - Mobile Cards + Desktop Table */}
      <div className="rounded-lg border border-border bg-card">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : issues.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
            <p>Документы не найдены</p>
            <Button asChild variant="link" className="mt-2">
              <Link to="/admin/upload">Загрузить первый выпуск</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="md:hidden divide-y">
              {issues.map((issue) => (
                <div key={issue.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{issue.publication?.title_ru || 'Неизвестно'}</p>
                    <p className="text-sm text-muted-foreground">
                      №{issue.issue_number} • {formatDate(issue.issue_date)} • {issue.language.toUpperCase()}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/document/${issue.id}`} target="_blank">
                          <Eye className="mr-2 h-4 w-4" />
                          Просмотр
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(issue)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Редактировать
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRetryOcr(issue)}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Повторить OCR
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDelete(issue)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <Table className="hidden md:table">
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>№</TableHead>
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
                {issues.map((issue) => (
                  <TableRow key={issue.id}>
                    <TableCell className="font-medium">
                      {issue.publication?.title_ru || 'Неизвестно'}
                    </TableCell>
                    <TableCell>{formatDate(issue.issue_date)}</TableCell>
                    <TableCell>№{issue.issue_number}</TableCell>
                    <TableCell>
                      <span className="uppercase">{issue.language}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {issue.stats?.views_count || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      {issue.stats?.downloads_count || 0}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Открыть меню</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/document/${issue.id}`} target="_blank">
                              <Eye className="mr-2 h-4 w-4" />
                              Просмотр
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(issue)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Редактировать
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRetryOcr(issue)}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Повторить OCR
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDelete(issue)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Страница {meta.current_page} из {meta.last_page}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.current_page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать выпуск</DialogTitle>
            <DialogDescription>
              {editingIssue?.publication?.title_ru}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="issue_number" className="mb-2 block">
                Номер выпуска
              </Label>
              <Input
                id="issue_number"
                value={editForm.issue_number}
                onChange={(e) => setEditForm({ ...editForm, issue_number: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="issue_date" className="mb-2 block">
                Дата выпуска
              </Label>
              <Input
                id="issue_date"
                type="date"
                value={editForm.issue_date}
                onChange={(e) => setEditForm({ ...editForm, issue_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="language" className="mb-2 block">
                Язык
              </Label>
              <Select 
                value={editForm.language} 
                onValueChange={(v) => setEditForm({ ...editForm, language: v })}
              >
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ru">Русский</SelectItem>
                  <SelectItem value="kz">Қазақша</SelectItem>
                  <SelectItem value="mix">Смешанный</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить выпуск?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить выпуск "{deletingIssue?.publication?.title_ru}" 
              №{deletingIssue?.issue_number} от {deletingIssue?.issue_date}?
              Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
