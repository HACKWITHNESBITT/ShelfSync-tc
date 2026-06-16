import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getAlerts } from "@/lib/queries"
import { PageHeader } from "@/components/dashboard/page-header"
import { AlertsList } from "@/components/dashboard/alerts-list"
import { AlertsHistory } from "@/components/alerts/alerts-history"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function AlertsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const businessId = (session.user as { businessId?: string }).businessId
  if (!businessId) redirect("/login")

  const [active, all] = await Promise.all([
    getAlerts(businessId, false),
    getAlerts(businessId, true),
  ])

  const resolved = all.filter((a) => a.resolved)

  return (
    <div>
      <PageHeader
        title="Alerts"
        description="Low-stock alerts across all branches"
      />
      <Tabs defaultValue="active">
        <TabsList className="mb-4">
          <TabsTrigger value="active">
            Active
            {active.length > 0 && (
              <span className="ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-xs text-white">
                {active.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved ({resolved.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <AlertsList alerts={active} businessId={businessId} />
        </TabsContent>
        <TabsContent value="resolved">
          <AlertsHistory alerts={resolved} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
