"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { SidebarNav } from "@/components/dashboard/sidebar-nav"

export function MobileNav({
  alertCount,
  businessId,
}: {
  alertCount: number
  businessId: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <div className="hidden lg:flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {/* empty space-holder for the desktop topbar left side */}
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 bg-sidebar px-0 py-0">
          <SheetHeader className="flex h-14 flex-row items-center border-b border-border px-4">
            <SheetTitle className="sr-only">Navigation menu</SheetTitle>
            <Logo className="h-6" />
          </SheetHeader>
          <div className="px-3 py-4">
            <SidebarNav alertCount={alertCount} onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
