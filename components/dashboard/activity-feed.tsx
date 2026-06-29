"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ActivityItem } from "@/lib/types"
import { ArrowLeftRight, Package, Bell, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

function ActivityIcon({ type }: { type: string }) {
  const cls = "h-3.5 w-3.5"
  if (type === "transfer") return <ArrowLeftRight className={cls} />
  if (type === "alert") return <Bell className={cls} />
  if (type === "settings") return <Settings className={cls} />
  return <Package className={cls} />
}

function TimeAgoText({ iso }: { iso: string }) {
  const [text, setText] = useState("just now")

  useEffect(() => {
    const update = () => {
      const diff = Date.now() - new Date(iso).getTime()
      const mins = Math.floor(diff / 60000)
      if (mins < 1) setText("just now")
      else if (mins < 60) setText(`${mins}m ago`)
      else {
        const hrs = Math.floor(mins / 60)
        if (hrs < 24) setText(`${hrs}h ago`)
        else setText(`${Math.floor(hrs / 24)}d ago`)
      }
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [iso])

  return text
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">
          Recent activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No activity yet
          </p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                  item.type === "transfer" && "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
                  item.type === "alert" && "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
                  item.type === "inventory" && "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
                  !["transfer", "alert", "inventory"].includes(item.type) && "bg-accent text-primary",
                )}
              >
                <ActivityIcon type={item.type} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-foreground">{item.message}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  <TimeAgoText iso={item.created_at} />
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
