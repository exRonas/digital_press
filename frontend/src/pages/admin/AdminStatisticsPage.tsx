import { useEffect, useState } from "react"
import { Download, Eye, FileText, TrendingUp, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import axios from "axios"

// Icon mapping
const iconMap: Record<string, any> = {
  FileText: FileText,
  Eye: Eye,
  Download: Download,
  TrendingUp: TrendingUp,
}

interface StatItem {
    title: string;
    value: string;
    change?: string;
    icon: string;
}

interface ActivityItem {
    action: string;
    document: string;
    time: string; // or time_ago/timestamp
    time_ago?: string;
}

interface NewspaperItem {
    title: string;
    views: number;
    percentage: number;
}

export function AdminStatisticsPage() {
  const [stats, setStats] = useState<StatItem[]>([])
  const [topNewspapers, setTopNewspapers] = useState<NewspaperItem[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/admin/stats');
        const data = response.data;
        
        setStats(data.stats);
        setTopNewspapers(data.topNewspapers);
        // Map backend activity format to UI format if needed, but Controller matches mostly
        setRecentActivity(data.recentActivity.map((item: any) => ({
            action: item.action,
            document: item.document,
            time: item.time_ago
        })));
        
      } catch (err) {
        console.error(err);
        setError("Не удалось загрузить статистику");
      // Fallback for demo/dev if backend fails or empty
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
      return (
          <div className="flex h-64 w-full items-center justify-center">
             <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
      )
  }

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

      {error ? (
          <div className="rounded-md bg-destructive/15 p-4 text-destructive mb-6">
              {error}
          </div>
      ) : (
      <>
      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => {
            const Icon = iconMap[stat.icon] || FileText;
            return (
              <Card key={i}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-sm bg-muted">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    </div>
                    {stat.change && (
                       <span className="text-xs sm:text-sm font-medium text-green-600">
                         {stat.change}
                       </span>
                    )}
                  </div>
                  <div className="mt-3 sm:mt-4">
                    <p className="text-xl sm:text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Newspapers */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">
              Популярные газеты
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {topNewspapers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Нет данных</p>
            ) : (
                <div className="space-y-3 sm:space-y-4">
                  {topNewspapers.map((newspaper) => (
                    <div key={newspaper.title}>
                      <div className="mb-1 flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-0.5 sm:gap-2">
                        <span className="font-medium text-foreground line-clamp-1">
                          {newspaper.title}
                        </span>
                        <span className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">
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
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">Недавняя активность</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Нет недавней активности</p>
            ) : (
                <div className="space-y-3 sm:space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 sm:gap-3 border-b border-border pb-3 sm:pb-4 last:border-0 last:pb-0"
                    >
                      <div className="mt-1 sm:mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-foreground">
                          {activity.action}
                        </p>
                        <p className="line-clamp-2 sm:truncate text-xs sm:text-sm text-muted-foreground">
                          {activity.document}
                        </p>
                      </div>
                      <span className="shrink-0 text-[10px] sm:text-xs text-muted-foreground">
                        {activity.time}
                      </span>
                    </div>
                  ))}
                </div>
            )}
          </CardContent>
        </Card>
      </div>
      </>
      )}
    </div>
  )
}

