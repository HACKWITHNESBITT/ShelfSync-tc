import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getBranches } from "@/lib/queries"
import { PageHeader } from "@/components/dashboard/page-header"
import { BranchesList, AddBranchButton } from "@/components/branches/branches-list"

export default async function BranchesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const businessId = (session.user as { businessId?: string }).businessId
  if (!businessId) redirect("/login")

  const branches = await getBranches(businessId)

  return (
    <div>
      <PageHeader
        title="Branches"
        description="Manage your store locations"
        action={<AddBranchButton businessId={businessId} />}
      />
      <BranchesList branches={branches} businessId={businessId} />
    </div>
  )
}
