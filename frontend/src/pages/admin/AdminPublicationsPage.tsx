import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Search, Loader2, MoreHorizontal, Edit, Trash2, Newspaper, BookOpen } from "lucide-react"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import axios from "@/lib/axios"

interface Publication {
  id: number;
  title_ru: string;
  title_kz: string | null;
  slug: string;
  history_ru: string | null;
  history_kz: string | null;
  issues_count: number;
  created_at: string;
}

export function AdminPublicationsPage() {
  const navigate = useNavigate()
  const [publications, setPublications] = useState<Publication[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Create Dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    title_ru: "",
    title_kz: "",
  })
  const [creating, setCreating] = useState(false)
  
  // Edit Dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingPublication, setEditingPublication] = useState<Publication | null>(null)
  const [editForm, setEditForm] = useState({
    title_ru: "",
    title_kz: "",
  })
  const [saving, setSaving] = useState(false)
  
  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingPublication, setDeletingPublication] = useState<Publication | null>(null)
  const [deleting, setDeleting] = useState(false)
  
  const { toast } = useToast()

  useEffect(() => {
    fetchPublications()
  }, [])

  const fetchPublications = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/admin/publications')
      setPublications(res.data)
    } catch (err) {
      console.error(err)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить издания",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredPublications = publications.filter(
    (pub) =>
      pub.title_ru.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pub.title_kz && pub.title_kz.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleCreate = async () => {
    if (!createForm.title_ru) {
      toast({
        title: "Ошибка",
        description: "Введите название на русском языке",
        variant: "destructive",
      })
      return
    }
    
    setCreating(true)
    try {
      const res = await axios.post('/admin/publications', createForm)
      setPublications([...publications, res.data])
      setCreateDialogOpen(false)
      setCreateForm({ title_ru: "", title_kz: "" })
      toast({
        title: "Издание создано",
        description: `"${res.data.title_ru}" добавлено в систему`,
      })
    } catch (err: any) {
      toast({
        title: "Ошибка",
        description: err.response?.data?.message || "Не удалось создать издание",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = (publication: Publication) => {
    setEditingPublication(publication)
    setEditForm({
      title_ru: publication.title_ru,
      title_kz: publication.title_kz || "",
    })
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingPublication) return
    
    setSaving(true)
    try {
      const res = await axios.put(`/admin/publications/${editingPublication.id}`, editForm)
      setPublications(publications.map(p => p.id === editingPublication.id ? res.data : p))
      setEditDialogOpen(false)
      toast({
        title: "Сохранено",
        description: "Название издания обновлено",
      })
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

  const handleDelete = (publication: Publication) => {
    setDeletingPublication(publication)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingPublication) return
    
    setDeleting(true)
    try {
      await axios.delete(`/admin/publications/${deletingPublication.id}`)
      setPublications(publications.filter(p => p.id !== deletingPublication.id))
      setDeleteDialogOpen(false)
      toast({
        title: "Удалено",
        description: "Издание удалено из системы",
      })
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

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            Издания
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Управление газетами и журналами в архиве
          </p>
        </div>
        <Button className="gap-2 w-full sm:w-auto" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Добавить издание
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Поиск по названию..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Publications - Mobile Cards + Desktop Table */}
      <div className="rounded-lg border border-border bg-card">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredPublications.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
            <Newspaper className="h-12 w-12 mb-4 opacity-50" />
            <p>Издания не найдены</p>
            <Button variant="link" className="mt-2" onClick={() => setCreateDialogOpen(true)}>
              Добавить первое издание
            </Button>
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="md:hidden divide-y">
              {filteredPublications.map((publication) => (
                <div key={publication.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{publication.title_ru}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {publication.title_kz || "Нет названия KZ"} • {publication.issues_count} выпусков
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/admin/publications/${publication.id}`)}>
                        <BookOpen className="mr-2 h-4 w-4" />
                        История издания
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(publication)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Редактировать
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(publication)}
                        disabled={publication.issues_count > 0}
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
                  <TableHead>Название (RU)</TableHead>
                  <TableHead>Название (KZ)</TableHead>
                  <TableHead>Выпусков</TableHead>
                  <TableHead className="w-[70px]">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPublications.map((publication) => (
                  <TableRow key={publication.id}>
                    <TableCell className="font-medium">
                      {publication.title_ru}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                    {publication.title_kz || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {publication.issues_count} шт.
                    </Badge>
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
                        <DropdownMenuItem onClick={() => navigate(`/admin/publications/${publication.id}`)}>
                          <BookOpen className="mr-2 h-4 w-4" />
                          История издания
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(publication)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Редактировать
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(publication)}
                          disabled={publication.issues_count > 0}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Удалить
                          {publication.issues_count > 0 && (
                            <span className="ml-2 text-xs">({publication.issues_count} выпусков)</span>
                          )}
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

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новое издание</DialogTitle>
            <DialogDescription>
              Добавьте новую газету или журнал в архив
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="create-title-ru" className="mb-2 block">
                Название на русском <span className="text-destructive">*</span>
              </Label>
              <Input
                id="create-title-ru"
                value={createForm.title_ru}
                onChange={(e) => setCreateForm({ ...createForm, title_ru: e.target.value })}
                placeholder="Казахстанская правда"
              />
            </div>
            <div>
              <Label htmlFor="create-title-kz" className="mb-2 block">
                Название на казахском
              </Label>
              <Input
                id="create-title-kz"
                value={createForm.title_kz}
                onChange={(e) => setCreateForm({ ...createForm, title_kz: e.target.value })}
                placeholder="Қазақстан правдасы"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать издание</DialogTitle>
            <DialogDescription>
              Измените название издания
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-title-ru" className="mb-2 block">
                Название на русском <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-title-ru"
                value={editForm.title_ru}
                onChange={(e) => setEditForm({ ...editForm, title_ru: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-title-kz" className="mb-2 block">
                Название на казахском
              </Label>
              <Input
                id="edit-title-kz"
                value={editForm.title_kz}
                onChange={(e) => setEditForm({ ...editForm, title_kz: e.target.value })}
              />
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
            <DialogTitle>Удалить издание?</DialogTitle>
            <DialogDescription>
              {deletingPublication?.issues_count && deletingPublication.issues_count > 0 ? (
                <span className="text-destructive">
                  Нельзя удалить издание "{deletingPublication?.title_ru}". 
                  Сначала удалите все выпуски ({deletingPublication?.issues_count} шт.)
                </span>
              ) : (
                <>
                  Вы уверены, что хотите удалить издание "{deletingPublication?.title_ru}"?
                  Это действие нельзя отменить.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete} 
              disabled={deleting || (deletingPublication?.issues_count ?? 0) > 0}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
