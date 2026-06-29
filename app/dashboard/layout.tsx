import { getAlerts } from "@/lib/queries"
import { requireContext } from "@/lib/session"
import { Logo } from "@/components/logo"
import { SidebarNav } from "@/components/dashboard/sidebar-nav"
import { UserMenu } from "@/components/dashboard/user-menu"
import { MobileNav } from "@/components/dashboard/mobile-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await requireContext()

  const alerts = await getAlerts(ctx.business.id)
  const alertCount = alerts.length

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex h-14 items-center border-b border-border px-4">
          <Logo className="h-6" />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <SidebarNav alertCount={alertCount} />
        </div>
        <div className="border-t border-border px-3 py-3">
          <UserMenu
            name={ctx.userName}
            email={ctx.userEmail}
          />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
          <MobileNav alertCount={alertCount} businessId={ctx.business.id} />
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            {alertCount > 0 && (
              <span className="hidden rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive sm:inline-flex">
                {alertCount} low-stock alert{alertCount > 1 ? "s" : ""}
              </span>
            )}
            <div className="lg:hidden">
              <UserMenu
                name={ctx.userName}
                email={ctx.userEmail}
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
