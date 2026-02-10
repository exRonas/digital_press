import { 
  BookOpen, 
  Upload, 
  FileText, 
  Users, 
  Library, 
  BarChart3,
  Search,
  Download,
  Eye,
  Shield,
  AlertTriangle,
  CheckCircle2,
  HelpCircle
} from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"

export function AdminHelpPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  return (
    <div className="max-w-4xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-foreground flex items-center gap-3">
          <BookOpen className="h-6 w-6" />
          Руководство пользователя
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Справочная информация по работе с системой "Цифровой банк печати"
        </p>
      </div>

      {/* Quick Start */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Быстрый старт
          </CardTitle>
          <CardDescription>
            Основные действия для начала работы
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-0.5">1</Badge>
            <div>
              <p className="font-medium">Загрузите выпуск газеты</p>
              <p className="text-sm text-muted-foreground">
                Перейдите в раздел "Загрузить выпуск", выберите издание, укажите дату и номер, загрузите PDF-файл
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-0.5">2</Badge>
            <div>
              <p className="font-medium">Дождитесь обработки OCR</p>
              <p className="text-sm text-muted-foreground">
                Система автоматически распознает текст из PDF для полнотекстового поиска
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-0.5">3</Badge>
            <div>
              <p className="font-medium">Проверьте документ в каталоге</p>
              <p className="text-sm text-muted-foreground">
                Загруженный выпуск появится в публичном каталоге и будет доступен для просмотра
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Guide */}
      <Accordion type="single" collapsible className="space-y-2">
        
        {/* Upload */}
        <AccordionItem value="upload" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <Upload className="h-5 w-5 text-primary" />
              <span>Загрузка выпусков</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground space-y-4 pb-4">
            <div>
              <h4 className="font-medium text-foreground mb-2">Как загрузить новый выпуск:</h4>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Перейдите в раздел <strong>"Загрузить выпуск"</strong></li>
                <li>Выберите <strong>издание</strong> из выпадающего списка</li>
                <li>Укажите <strong>дату выпуска</strong></li>
                <li>Введите <strong>номер выпуска</strong></li>
                <li>Выберите <strong>язык</strong> (русский, казахский или смешанный)</li>
                <li>Загрузите <strong>PDF-файл</strong> (перетащите или нажмите для выбора)</li>
                <li>Нажмите <strong>"Загрузить"</strong></li>
              </ol>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="flex items-center gap-2 text-sm">
                <HelpCircle className="h-4 w-4" />
                <strong>Поддерживаемые файлы:</strong> PDF до 500 МБ. Для больших файлов используется чанковая загрузка.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-2">После загрузки:</h4>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Система автоматически запустит <strong>OCR-распознавание</strong></li>
                <li>Текст будет проиндексирован для <strong>полнотекстового поиска</strong></li>
                <li>Документ сразу появится в <strong>публичном каталоге</strong></li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Documents */}
        <AccordionItem value="documents" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <span>Управление документами</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground space-y-4 pb-4">
            <div>
              <h4 className="font-medium text-foreground mb-2">Список документов:</h4>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Поиск</strong> — фильтрация по названию издания</li>
                <li><strong>Фильтр по языку</strong> — русский, казахский или все</li>
                <li><strong>Пагинация</strong> — 20 документов на странице</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-2">Действия с документом:</h4>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><Eye className="h-4 w-4 inline mr-1" /><strong>Просмотр</strong> — открыть PDF в новой вкладке</li>
                <li><strong>Редактировать</strong> — изменить номер, дату, язык</li>
                <li><strong>Повторить OCR</strong> — перезапустить распознавание текста</li>
                <li><strong>Удалить</strong> — удалить выпуск из архива (необратимо)</li>
              </ul>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <p className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400">
                <AlertTriangle className="h-4 w-4" />
                <strong>Внимание:</strong> Удаление документа необратимо. Файл и все связанные данные будут удалены.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Statistics */}
        <AccordionItem value="statistics" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span>Статистика</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground space-y-4 pb-4">
            <div>
              <h4 className="font-medium text-foreground mb-2">Доступные метрики:</h4>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Всего документов</strong> — общее количество выпусков в архиве</li>
                <li><strong>Всего просмотров</strong> — сколько раз документы были открыты</li>
                <li><strong>Всего скачиваний</strong> — сколько раз документы были скачаны</li>
                <li><Eye className="h-4 w-4 inline mr-1" /><strong>Просмотры</strong> — по каждому документу</li>
                <li><Download className="h-4 w-4 inline mr-1" /><strong>Скачивания</strong> — по каждому документу</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Admin-only sections */}
        {isAdmin && (
          <>
            <AccordionItem value="publications" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Library className="h-5 w-5 text-primary" />
                  <span>Управление изданиями</span>
                  <Badge variant="secondary" className="ml-2">Только админ</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4 pb-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Издания (газеты/журналы):</h4>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Добавить</strong> — создать новое издание (название на RU и KZ)</li>
                    <li><strong>Редактировать</strong> — изменить название</li>
                    <li><strong>Удалить</strong> — только если нет загруженных выпусков</li>
                  </ul>
                </div>

                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4" />
                    Издание нельзя удалить, если к нему привязаны выпуски. Сначала удалите все выпуски.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="users" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <span>Управление пользователями</span>
                  <Badge variant="secondary" className="ml-2">Только админ</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4 pb-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Роли пользователей:</h4>
                  <ul className="list-disc list-inside space-y-2 ml-2">
                    <li>
                      <strong>Оператор</strong> — может загружать и редактировать документы, просматривать статистику
                    </li>
                    <li>
                      <strong>Администратор</strong> — полный доступ: управление пользователями, изданиями, все функции оператора
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-2">Управление:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Добавить</strong> — создать нового пользователя (логин, пароль, роль)</li>
                    <li><strong>Редактировать</strong> — изменить данные, сменить пароль</li>
                    <li><strong>Заблокировать</strong> — отключить доступ без удаления</li>
                    <li><strong>Удалить</strong> — полностью удалить пользователя</li>
                  </ul>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <p className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400">
                    <AlertTriangle className="h-4 w-4" />
                    Нельзя удалить или понизить роль самому себе.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </>
        )}

        {/* Search */}
        <AccordionItem value="search" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-primary" />
              <span>Полнотекстовый поиск</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground space-y-4 pb-4">
            <div>
              <h4 className="font-medium text-foreground mb-2">Как работает поиск:</h4>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>При загрузке PDF система <strong>распознает текст (OCR)</strong></li>
                <li>Текст индексируется для <strong>быстрого поиска</strong></li>
                <li>Пользователи могут искать по <strong>содержимому газет</strong> в каталоге</li>
              </ul>
            </div>

            <div className="bg-muted/50 rounded-lg p-3">
              <p className="flex items-center gap-2 text-sm">
                <HelpCircle className="h-4 w-4" />
                Если поиск не находит текст, попробуйте <strong>"Повторить OCR"</strong> для документа.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Версия системы: 1.0 • © 2026 Цифровой банк печати</p>
      </div>
    </div>
  )
}
