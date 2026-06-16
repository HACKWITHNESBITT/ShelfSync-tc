import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import {
  getDashboardStats,
  getActivity,
  getAlerts,
  getStockByBranch,
} from "@/lib/queries"
import { Building2, Boxes, ArrowLeftRight, Bell } from "lucide-react"
import { StatCard } from "@/components/dashboard/stat-card"
import { PageHeader } from "@/components/dashboard/page-header"
import { StockChart } from "@/components/dashboard/stock-chart"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { AlertsList } from "@/components/dashboard/alerts-list"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const businessId = (session.user as { businessId?: string }).businessId
  if (!businessId) redirect("/login")

  const [stats, chartData, activity, alerts] = await Promise.all([
    getDashboardStats(businessId),
    getStockByBranch(businessId),
    getActivity(businessId, 8),
    getAlerts(businessId),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Your inventory at a glance"
        action={
          <Button size="sm" render={<Link href="/dashboard/transfers" />}>
            New transfer
          </Button>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          title="Branches"
          value={stats.branch_count}
          icon={Building2}
          sub="store locations"
        />
        <StatCard
          title="Products"
          value={stats.product_count}
          icon={Boxes}
          sub="unique SKUs"
        />
        <StatCard
          title="Total units"
          value={stats.total_units.toLocaleString()}
          icon={Boxes}
          variant="success"
          sub="across all branches"
        />
        <StatCard
          title="Low-stock alerts"
          value={stats.low_stock_count}
          icon={Bell}
          variant={stats.low_stock_count > 0 ? "warning" : "default"}
          sub={stats.low_stock_count > 0 ? "need attention" : "all good"}
        />
      </div>

      {/* Chart + Activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <StockChart data={chartData} />
        </div>
        <ActivityFeed items={activity} />
      </div>

      {/* Active alerts */}
      {alerts.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Active alerts</h2>
            <Button variant="ghost" size="sm" render={<Link href="/dashboard/alerts" />}>
              View all
            </Button>
          </div>
          <AlertsList alerts={alerts.slice(0, 5)} businessId={businessId} />
        </div>
      )}
    </div>
  )
}
