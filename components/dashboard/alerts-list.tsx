"use client"

import { useState, useTransition } from "react"
import { AlertTriangle, CheckCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { AlertDetail } from "@/lib/types"

export function AlertsList({
  alerts,
  businessId,
}: {
  alerts: AlertDetail[]
  businessId: string
}) {
  const router = useRouter()
  const [resolving, setResolving] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  async function resolve(alertId: string) {
    setResolving(alertId)
    try {
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved: true }),
      })
      if (!res.ok) throw new Error()
      toast.success("Alert resolved")
      startTransition(() => router.refresh())
    } catch {
      toast.error("Failed to resolve alert")
    } finally {
      setResolving(null)
    }
  }

  if (alerts.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          No active alerts — all stock levels look good
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <Card key={alert.id} className="border-border">
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3 min-w-0">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {alert.product_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {alert.branch_name} &middot;{" "}
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    {alert.quantity} units
                  </span>{" "}
                  (threshold: {alert.low_stock_threshold})
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant="outline" className="hidden sm:flex text-xs text-amber-600 border-amber-300 dark:text-amber-400">
                {alert.sku}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => resolve(alert.id)}
                disabled={resolving === alert.id}
              >
                {resolving === alert.id ? "Resolving..." : "Resolve"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
