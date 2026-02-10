"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  FileText,
  LogOut,
  Newspaper,
  Upload,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { AccessibilityProvider } from "@/components/accessibility-provider"
import { cn } from "@/lib/utils"

const navItems = [
  {
    href: "/admin",
    label: "Документы",
    labelKz: "Құжаттар",
    icon: FileText,
  },
  {
    href: "/admin/upload",
    label: "Загрузить выпуск",
    labelKz: "Шығарылым жүктеу",
    icon: Upload,
  },
  {
    href: "/admin/statistics",
    label: "Статистика",
    labelKz: "Статистика",
    icon: BarChart3,
  },
  {
    href: "/admin/users",
    label: "Пользователи",
    labelKz: "Пайдаланушылар",
    icon: Users,
  },
]

function AdminLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-sidebar">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-sidebar-primary">
            <Newspaper className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <div>
            <p className="font-serif text-sm font-semibold text-sidebar-foreground">
              Панель управления
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
            className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Link href="/">
              <LogOut className="h-5 w-5" />
              Выйти на сайт
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 bg-background">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  )
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AccessibilityProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AccessibilityProvider>
  )
}
