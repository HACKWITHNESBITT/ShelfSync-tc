import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { getBranch, getBranchInventory } from "@/lib/queries"
import { PageHeader } from "@/components/dashboard/page-header"
import { BranchInventoryTable } from "@/components/branches/branch-inventory-table"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

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
        <Link
          href="/dashboard/branches"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 text-muted-foreground")}
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Branches
        </Link>
      </div>
      <PageHeader
        title={branch.name}
        description={[branch.address, branch.city].filter(Boolean).join(", ") || "No address"}
        action={
          <Link href="/dashboard/transfers" className={buttonVariants({ size: "sm" })}>
            Transfer stock
          </Link>
        }
      />
      <BranchInventoryTable inventory={inventory} branchId={id} businessId={businessId} />
    </div>
  )
}
