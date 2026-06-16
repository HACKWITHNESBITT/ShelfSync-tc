import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { getBranch, getBranchInventory } from "@/lib/queries"
import { PageHeader } from "@/components/dashboard/page-header"
import { BranchInventoryTable } from "@/components/branches/branch-inventory-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function BranchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")
  const businessId = (session.user as { businessId?: string }).businessId
  if (!businessId) redirect("/login")

  const [branch, inventory] = await Promise.all([
    getBranch(businessId, id),
    getBranchInventory(businessId, id),
  ])

  if (!branch) notFound()

  return (
    <div>
      <div className="mb-1">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 text-muted-foreground"
          render={<Link href="/dashboard/branches" />}
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Branches
        </Button>
      </div>
      <PageHeader
        title={branch.name}
        description={[branch.address, branch.city].filter(Boolean).join(", ") || "No address"}
        action={
          <Button size="sm" render={<Link href="/dashboard/transfers" />}>
            Transfer stock
          </Button>
        }
      />
      <BranchInventoryTable inventory={inventory} branchId={id} businessId={businessId} />
    </div>
  )
}
