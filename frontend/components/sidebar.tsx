"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Image,
  AlertTriangle,
  Lightbulb,
  MessageSquare,
  BarChart3
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Creatives", href: "/creatives", icon: Image },
  { name: "Anomalies", href: "/anomalies", icon: AlertTriangle },
  { name: "Insights", href: "/insights", icon: Lightbulb },
  { name: "Query", href: "/query", icon: MessageSquare },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="sticky top-0 flex h-screen w-64 flex-col border-r bg-card">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center border-b px-6">
        <BarChart3 className="mr-2 h-6 w-6 text-primary" />
        <span className="text-lg font-semibold">Meta Analytics</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <Separator />

      {/* Footer */}
      <div className="p-4">
        <p className="text-xs text-muted-foreground">
          Powered by OpenRouter AI
        </p>
      </div>
    </div>
  )
}
