"use client"

import { Download, Eye, FileText, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const stats = [
  {
    title: "Всего документов",
    value: "2,847",
    change: "+12%",
    icon: FileText,
  },
  {
    title: "Просмотров за месяц",
    value: "45,231",
    change: "+8%",
    icon: Eye,
  },
  {
    title: "Загрузок за месяц",
    value: "3,102",
    change: "+15%",
    icon: Download,
  },
  {
    title: "Новых выпусков",
    value: "127",
    change: "+23%",
    icon: TrendingUp,
  },
]

const topNewspapers = [
  { title: "Казахстанская правда", views: 12453, percentage: 28 },
  { title: "Егемен Қазақстан", views: 9876, percentage: 22 },
  { title: "Вечерний Алматы", views: 7654, percentage: 17 },
  { title: "Астана Times", views: 6543, percentage: 15 },
  { title: "Қазақ әдебиеті", views: 4321, percentage: 10 },
  { title: "Экспресс К", views: 3567, percentage: 8 },
]

const recentActivity = [
  {
    action: "Загружен выпуск",
    document: "Казахстанская правда №2847",
    time: "5 минут назад",
  },
  {
    action: "Просмотр документа",
    document: "Егемен Қазақстан №1523",
    time: "12 минут назад",
  },
  {
    action: "Скачан документ",
    document: "Вечерний Алматы №982",
    time: "23 минуты назад",
  },
  {
    action: "Загружен выпуск",
    document: "Астана Times №445",
    time: "1 час назад",
  },
  {
    action: "Повторен OCR",
    document: "Қазақ әдебиеті №671",
    time: "2 часа назад",
  },
]

export default function AdminStatisticsPage() {
  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-foreground">
          Статистика
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Обзор активности и использования архива
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-muted">
                  <stat.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium text-green-600">
                  {stat.change}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Newspapers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Популярные газеты
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topNewspapers.map((newspaper) => (
                <div key={newspaper.title}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">
                      {newspaper.title}
                    </span>
                    <span className="text-muted-foreground">
                      {newspaper.views.toLocaleString()} просмотров
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${newspaper.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Недавняя активность</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {activity.action}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {activity.document}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
