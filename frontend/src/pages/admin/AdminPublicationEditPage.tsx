import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import axios from "@/lib/axios"

interface Publication {
  id: number
  title_ru: string
  title_kz: string | null
  slug: string
  history_ru: string | null
  history_kz: string | null
  issues_count: number
}

export function AdminPublicationEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publication, setPublication] = useState<Publication | null>(null)

  const [form, setForm] = useState({
    title_ru: "",
    title_kz: "",
    history_ru: "",
    history_kz: "",
  })

  useEffect(() => {
    fetchPublication()
  }, [id])

  const fetchPublication = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`/admin/publications/${id}`)
      setPublication(res.data)
      setForm({
        title_ru: res.data.title_ru || "",
        title_kz: res.data.title_kz || "",
        history_ru: res.data.history_ru || "",
        history_kz: res.data.history_kz || "",
      })
    } catch (err) {
      console.error(err)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить издание",
        variant: "destructive",
      })
      navigate("/admin/publications")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!form.title_ru) {
      toast({
        title: "Ошибка",
        description: "Введите название на русском языке",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      await axios.put(`/admin/publications/${id}`, form)
      toast({
        title: "Сохранено",
        description: "Изменения успешно сохранены",
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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/publications")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-serif text-2xl font-bold text-foreground">
            Редактирование издания
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {publication?.title_ru}
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Сохранить
        </Button>
      </div>

      {/* Form */}
      <div className="space-y-8">
        {/* Basic Info */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 font-semibold text-foreground">Основная информация</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="title_ru" className="mb-2 block">
                Название (RU) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title_ru"
                value={form.title_ru}
                onChange={(e) => setForm({ ...form, title_ru: e.target.value })}
                placeholder="Казахстанская правда"
              />
            </div>
            <div>
              <Label htmlFor="title_kz" className="mb-2 block">
                Название (KZ)
              </Label>
              <Input
                id="title_kz"
                value={form.title_kz}
                onChange={(e) => setForm({ ...form, title_kz: e.target.value })}
                placeholder="Қазақстан правдасы"
              />
            </div>
          </div>
        </div>

        {/* History */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 font-semibold text-foreground">История издания</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Напишите историю газеты или журнала. Этот текст будет отображаться на публичной странице издания.
          </p>
          
          <Tabs defaultValue="ru" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="ru">Русский</TabsTrigger>
              <TabsTrigger value="kz">Қазақша</TabsTrigger>
            </TabsList>
            
            <TabsContent value="ru">
              <div>
                <Label htmlFor="history_ru" className="mb-2 block">
                  История на русском языке
                </Label>
                <Textarea
                  id="history_ru"
                  value={form.history_ru}
                  onChange={(e) => setForm({ ...form, history_ru: e.target.value })}
                  placeholder="Газета была основана в 1920 году..."
                  className="min-h-[300px] font-sans text-base leading-relaxed"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  {form.history_ru.length} символов
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="kz">
              <div>
                <Label htmlFor="history_kz" className="mb-2 block">
                  История на казахском языке
                </Label>
                <Textarea
                  id="history_kz"
                  value={form.history_kz}
                  onChange={(e) => setForm({ ...form, history_kz: e.target.value })}
                  placeholder="Газет 1920 жылы құрылған..."
                  className="min-h-[300px] font-sans text-base leading-relaxed"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  {form.history_kz.length} символов
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Save Button (bottom) */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate("/admin/publications")}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Сохранить изменения
          </Button>
        </div>
      </div>
    </div>
  )
}
