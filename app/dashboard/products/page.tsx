import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getProducts, getBranches } from "@/lib/queries"
import { PageHeader } from "@/components/dashboard/page-header"
import { ProductsTable, AddProductButton } from "@/components/products/products-table"

export default async function ProductsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const businessId = (session.user as { businessId?: string }).businessId
  if (!businessId) redirect("/login")

  const [products, branches] = await Promise.all([
    getProducts(businessId),
    getBranches(businessId),
  ])

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage your product catalog and set inventory levels per branch"
        action={<AddProductButton businessId={businessId} branches={branches} />}
      />
      <ProductsTable products={products} businessId={businessId} branches={branches} />
    </div>
  )
}
