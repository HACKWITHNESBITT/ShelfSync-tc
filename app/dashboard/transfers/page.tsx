import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getTransfers, getBranches, getProducts } from "@/lib/queries"
import { PageHeader } from "@/components/dashboard/page-header"
import { TransfersView } from "@/components/transfers/transfers-view"

export default async function TransfersPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const businessId = (session.user as { businessId?: string }).businessId
  if (!businessId) redirect("/login")

  const [transfers, branches, products] = await Promise.all([
    getTransfers(businessId, 50),
    getBranches(businessId),
    getProducts(businessId),
  ])

  return (
    <div>
      <PageHeader
        title="Transfers"
        description="Move stock between branches"
        action={
          <TransfersView.NewTransferButton
            branches={branches}
            products={products}
          />
        }
      />
      <TransfersView transfers={transfers} branches={branches} products={products} />
    </div>
  )
}
