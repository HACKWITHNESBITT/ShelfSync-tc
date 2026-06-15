"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  Boxes,
  ArrowLeftRight,
  Bell,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/branches", label: "Branches", icon: Building2 },
  { href: "/dashboard/products", label: "Products", icon: Boxes },
  { href: "/dashboard/transfers", label: "Transfers", icon: ArrowLeftRight },
  { href: "/dashboard/alerts", label: "Alerts", icon: Bell },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export function SidebarNav({
  alertCount = 0,
  onNavigate,
}: {
  alertCount?: number
  onNavigate?: () => void
}) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1">
      {links.map((link) => {
        const active =
          link.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <span className="flex items-center gap-3">
              <link.icon className="h-4 w-4" />
              {link.label}
            </span>
            {link.label === "Alerts" && alertCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-semibold text-white">
                {alertCount}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
