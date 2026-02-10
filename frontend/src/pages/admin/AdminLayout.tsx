import { useState } from "react"
import { Link, useLocation, Outlet } from "react-router-dom"
import {
  BarChart3,
  FileText,
  LogOut,
  Newspaper,
  Upload,
  Users,
  Library,
  HelpCircle,
  Menu,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"

const navItems = [
  {
    href: "/admin",
    label: "Документы",
    labelKz: "Құжаттар",
    icon: FileText,
    adminOnly: false,
  },
  {
    href: "/admin/upload",
    label: "Загрузить выпуск",
    labelKz: "Шығарылым жүктеу",
    icon: Upload,
    adminOnly: false,
  },
  {
    href: "/admin/statistics",
    label: "Статистика",
    labelKz: "Статистика",
    icon: BarChart3,
    adminOnly: false,
  },
  {
    href: "/admin/publications",
    label: "Издания",
    labelKz: "Басылымдар",
    icon: Library,
    adminOnly: true,
  },
  {
    href: "/admin/users",
    label: "Пользователи",
    labelKz: "Пайдаланушылар",
    icon: Users,
    adminOnly: true,
  },
  {
    href: "/admin/help",
    label: "Помощь",
    labelKz: "Көмек",
    icon: HelpCircle,
    adminOnly: false,
  },
]

export function AdminLayout() {
  const location = useLocation()
  const pathname = location.pathname
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Filter nav items based on user role
  const visibleNavItems = navItems.filter(
    item => !item.adminOnly || user?.role === 'admin'
  )

  return (
    <div className="flex min-h-screen">
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary text-primary-foreground">
            <Newspaper className="h-4 w-4" />
          </div>
          <span className="font-serif text-sm font-semibold">Панель управления</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-gray-50 dark:bg-gray-900/50 transition-transform duration-300",
        "md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo - hidden on mobile (shown in mobile header) */}
        <Link to="/" className="hidden md:flex h-16 items-center gap-3 border-b border-sidebar-border px-6 hover:bg-accent/50 transition-colors">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary text-primary-foreground">
            <Newspaper className="h-4 w-4" />
          </div>
          <div>
            <p className="font-serif text-sm font-semibold text-foreground">
              Панель управления
            </p>
          </div>
        </Link>

        {/* Mobile spacer for header */}
        <div className="h-14 md:hidden" />

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
            {visibleNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <Button
            asChild
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Link to="/">
              <LogOut className="h-5 w-5" />
              Выйти на сайт
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pt-14 md:pt-0 md:pl-64 transition-all duration-300 ease-in-out">
        <div className="container py-6 px-4 md:py-8 md:px-8">
            <Outlet />
        </div>
      </main>
    </div>
  )
}
