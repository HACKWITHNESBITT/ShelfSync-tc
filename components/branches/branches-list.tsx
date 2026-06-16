"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Building2, Package, AlertTriangle, Trash2, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import type { BranchWithStats } from "@/lib/types"

export function AddBranchButton({ businessId }: { businessId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: "", address: "", city: "" })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? "Failed")
      }
      toast.success("Branch created")
      setOpen(false)
      setForm({ name: "", address: "", city: "" })
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create branch")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-4 w-4" />
        Add branch
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add branch</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="b-name">Name</Label>
              <Input
                id="b-name"
                placeholder="Downtown Store"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-address">Address</Label>
              <Input
                id="b-address"
                placeholder="123 Main St"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-city">City</Label>
              <Input
                id="b-city"
                placeholder="New York"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create branch"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function BranchCard({
  branch,
  businessId,
}: {
  branch: BranchWithStats
  businessId: string
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [deleting, setDeleting] = useState(false)

  async function deleteBranch() {
    if (!confirm(`Delete "${branch.name}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/branches/${branch.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Branch deleted")
      startTransition(() => router.refresh())
    } catch {
      toast.error("Failed to delete branch")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card className="border-border transition-shadow hover:shadow-sm">
      <CardContent className="p-5">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-primary">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{branch.name}</p>
              {branch.city && (
                <p className="text-xs text-muted-foreground">{branch.city}</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={deleteBranch}
            disabled={deleting}
            aria-label="Delete branch"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-secondary px-2 py-2">
            <p className="text-base font-semibold text-foreground">{branch.product_count}</p>
            <p className="text-xs text-muted-foreground">products</p>
          </div>
          <div className="rounded-md bg-secondary px-2 py-2">
            <p className="text-base font-semibold text-foreground">
              {branch.total_units.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">units</p>
          </div>
          <div className={`rounded-md px-2 py-2 ${branch.low_stock_count > 0 ? "bg-amber-50 dark:bg-amber-900/20" : "bg-secondary"}`}>
            <p className={`text-base font-semibold ${branch.low_stock_count > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
              {branch.low_stock_count}
            </p>
            <p className="text-xs text-muted-foreground">low stock</p>
          </div>
        </div>

        {branch.low_stock_count > 0 && (
          <div className="mb-3 flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1.5 dark:bg-amber-900/20">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs text-amber-600 dark:text-amber-400">
              {branch.low_stock_count} item{branch.low_stock_count > 1 ? "s" : ""} below threshold
            </span>
          </div>
        )}

        <Link
          href={`/dashboard/branches/${branch.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
        >
          View inventory
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Link>
      </CardContent>
    </Card>
  )
}

export function BranchesList({
  branches,
  businessId,
}: {
  branches: BranchWithStats[]
  businessId: string
}) {
  if (branches.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <p className="text-sm font-medium text-foreground">No branches yet</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Add your first store location to get started
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {branches.map((b) => (
        <BranchCard key={b.id} branch={b} businessId={businessId} />
      ))}
    </div>
  )
}

BranchesList.AddButton = AddBranchButton
