import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { query } from "@/lib/db"
import type { Business } from "@/lib/types"
import { PageHeader } from "@/components/dashboard/page-header"
import { SettingsForm } from "@/components/settings/settings-form"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const businessId = (session.user as { businessId?: string }).businessId
  if (!businessId) redirect("/login")

  const { rows } = await query<Business>(
    "SELECT * FROM businesses WHERE id = $1 LIMIT 1",
    [businessId],
  )
  const business = rows[0]
  if (!business) redirect("/login")

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your business preferences"
      />
      <SettingsForm
        businessId={businessId}
        initialName={business.name}
        initialThreshold={business.default_threshold}
        userName={session.user.name ?? ""}
        userEmail={session.user.email ?? ""}
      />
    </div>
  )
}
