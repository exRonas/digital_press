import { useState, useEffect } from "react"
import { Plus, Search, Loader2, MoreHorizontal, Edit, Trash2, Shield, ShieldCheck } from "lucide-react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import axios from "@/lib/axios"

interface User {
  id: number;
  name: string;
  username: string;
  role: 'admin' | 'operator';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Create Dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: "",
    username: "",
    password: "",
    role: "operator" as 'admin' | 'operator',
    is_active: true,
  })
  const [creating, setCreating] = useState(false)
  
  // Edit Dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    username: "",
    password: "",
    role: "operator" as 'admin' | 'operator',
    is_active: true,
  })
  const [saving, setSaving] = useState(false)
  
  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)
  
  const { toast } = useToast()
  const { user: currentUser } = useAuth()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/admin/users')
      setUsers(res.data)
    } catch (err) {
      console.error(err)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить пользователей",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreate = async () => {
    if (!createForm.name || !createForm.username || !createForm.password) {
      toast({
        title: "Ошибка",
        description: "Заполните все обязательные поля",
        variant: "destructive",
      })
      return
    }
    
    setCreating(true)
    try {
      const res = await axios.post('/admin/users', createForm)
      setUsers([...users, res.data])
      setCreateDialogOpen(false)
      setCreateForm({
        name: "",
        username: "",
        password: "",
        role: "operator",
        is_active: true,
      })
      toast({
        title: "Пользователь создан",
        description: `${res.data.name} добавлен в систему`,
      })
    } catch (err: any) {
      toast({
        title: "Ошибка",
        description: err.response?.data?.message || "Не удалось создать пользователя",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setEditForm({
      name: user.name,
      username: user.username,
      password: "", // Don't show password
      role: user.role,
      is_active: user.is_active,
    })
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingUser) return
    
    setSaving(true)
    try {
      const data: any = {
        name: editForm.name,
        username: editForm.username,
        role: editForm.role,
        is_active: editForm.is_active,
      }
      // Only send password if it was changed
      if (editForm.password) {
        data.password = editForm.password
      }
      
      const res = await axios.put(`/admin/users/${editingUser.id}`, data)
      setUsers(users.map(u => u.id === editingUser.id ? res.data : u))
      setEditDialogOpen(false)
      toast({
        title: "Сохранено",
        description: "Данные пользователя обновлены",
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

  const handleDelete = (user: User) => {
    setDeletingUser(user)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingUser) return
    
    setDeleting(true)
    try {
      await axios.delete(`/admin/users/${deletingUser.id}`)
      setUsers(users.filter(u => u.id !== deletingUser.id))
      setDeleteDialogOpen(false)
      toast({
        title: "Удалено",
        description: "Пользователь удален из системы",
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            Пользователи
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Управление операторами и администраторами системы
          </p>
        </div>
        <Button className="gap-2 w-full sm:w-auto" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Добавить пользователя
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Поиск по имени или логину..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Users - Mobile Cards + Desktop Table */}
      <div className="rounded-lg border border-border bg-card">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
            <p>Пользователи не найдены</p>
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="md:hidden divide-y">
              {filteredUsers.map((user) => (
                <div key={user.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {user.role === 'admin' ? (
                      <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                    ) : (
                      <Shield className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate">{user.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        @{user.username} • {user.role === 'admin' ? 'Админ' : 'Оператор'}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(user)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Редактировать
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(user)}
                        disabled={currentUser?.id === user.id}
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
                  <TableHead>Имя</TableHead>
                  <TableHead>Логин</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Создан</TableHead>
                  <TableHead className="w-[70px]">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {user.role === 'admin' ? (
                          <ShieldCheck className="h-4 w-4 text-primary" />
                        ) : (
                          <Shield className="h-4 w-4 text-muted-foreground" />
                        )}
                        {user.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.username}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role === 'admin' ? 'Админ' : 'Оператор'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'outline' : 'destructive'}>
                        {user.is_active ? 'Активен' : 'Заблокирован'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.created_at)}
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
                          <DropdownMenuItem onClick={() => handleEdit(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Редактировать
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(user)}
                            disabled={currentUser?.id === user.id}
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

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый пользователь</DialogTitle>
            <DialogDescription>
              Добавьте нового оператора или администратора в систему
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="create-name" className="mb-2 block">
                Имя <span className="text-destructive">*</span>
              </Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Введите имя"
              />
            </div>
            <div>
              <Label htmlFor="create-username" className="mb-2 block">
                Логин <span className="text-destructive">*</span>
              </Label>
              <Input
                id="create-username"
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                placeholder="username"
              />
            </div>
            <div>
              <Label htmlFor="create-password" className="mb-2 block">
                Пароль <span className="text-destructive">*</span>
              </Label>
              <Input
                id="create-password"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="Минимум 8 символов"
              />
            </div>
            <div>
              <Label htmlFor="create-role" className="mb-2 block">
                Роль
              </Label>
              <Select
                value={createForm.role}
                onValueChange={(v: 'admin' | 'operator') => setCreateForm({ ...createForm, role: v })}
              >
                <SelectTrigger id="create-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operator">Оператор</SelectItem>
                  <SelectItem value="admin">Администратор</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="create-active">Активен</Label>
              <Switch
                id="create-active"
                checked={createForm.is_active}
                onCheckedChange={(checked) => setCreateForm({ ...createForm, is_active: checked })}
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
            <DialogTitle>Редактировать пользователя</DialogTitle>
            <DialogDescription>
              {editingUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name" className="mb-2 block">
                Имя
              </Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-username" className="mb-2 block">
                Логин
              </Label>
              <Input
                id="edit-username"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-password" className="mb-2 block">
                Новый пароль
              </Label>
              <Input
                id="edit-password"
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                placeholder="Оставьте пустым, чтобы не менять"
              />
            </div>
            <div>
              <Label htmlFor="edit-role" className="mb-2 block">
                Роль
              </Label>
              <Select
                value={editForm.role}
                onValueChange={(v: 'admin' | 'operator') => setEditForm({ ...editForm, role: v })}
                disabled={currentUser?.id === editingUser?.id}
              >
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operator">Оператор</SelectItem>
                  <SelectItem value="admin">Администратор</SelectItem>
                </SelectContent>
              </Select>
              {currentUser?.id === editingUser?.id && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Нельзя изменить свою роль
                </p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-active">Активен</Label>
              <Switch
                id="edit-active"
                checked={editForm.is_active}
                onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })}
                disabled={currentUser?.id === editingUser?.id}
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
            <DialogTitle>Удалить пользователя?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить пользователя "{deletingUser?.name}"?
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
