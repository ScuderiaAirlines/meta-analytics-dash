"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  AlertTriangle,
  Image,
  Lightbulb,
  MessageSquare,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Anomalies", href: "/anomalies", icon: AlertTriangle },
  { name: "Creatives", href: "/creatives", icon: Image },
  { name: "Insights", href: "/insights", icon: Lightbulb },
  { name: "Query", href: "/query", icon: MessageSquare },
]

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-white shadow-md text-slate-600 hover:text-slate-900"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 bg-white border-r border-slate-200 z-40",
          collapsed ? "lg:w-16" : "lg:w-64"
        )}
      >
        {/* Logo & Toggle */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">
          {!collapsed && (
            <h1 className="text-lg font-bold text-slate-900">Meta Analytics</h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200">
          {!collapsed && (
            <p className="text-xs text-slate-500">
              Meta Ads Analytics v1.0
            </p>
          )}
        </div>
      </aside>

      {/* Sidebar - Mobile */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-slate-900/50 z-40"
            onClick={() => setMobileOpen(false)}
          />

          {/* Sidebar */}
          <aside className="lg:hidden fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-50">
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">
              <h1 className="text-lg font-bold text-slate-900">Meta Analytics</h1>
            </div>

            <nav className="px-3 py-4 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </aside>
        </>
      )}

      {/* Main Content */}
      <main
        className={cn(
          "transition-all duration-300",
          collapsed ? "lg:pl-16" : "lg:pl-64"
        )}
      >
        {children}
      </main>
    </div>
  )
}
