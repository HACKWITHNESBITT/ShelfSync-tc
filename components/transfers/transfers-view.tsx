"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, ArrowRight, ArrowLeftRight } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import type { BranchWithStats, ProductWithStock, TransferDetail } from "@/lib/types"

export function NewTransferButton({
  branches,
  products,
}: {
  branches: BranchWithStats[]
  products: ProductWithStock[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    fromBranchId: "",
    toBranchId: "",
    productId: "",
    quantity: "1",
  })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (form.fromBranchId === form.toBranchId) {
      toast.error("Source and destination must be different branches")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromBranchId: form.fromBranchId,
          toBranchId: form.toBranchId,
          productId: form.productId,
          quantity: parseInt(form.quantity, 10),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed")
      toast.success("Transfer completed")
      setOpen(false)
      setForm({ fromBranchId: "", toBranchId: "", productId: "", quantity: "1" })
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Transfer failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-4 w-4" />
        New transfer
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New transfer</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>From branch</Label>
              <Select
                value={form.fromBranchId}
                onValueChange={(v) => setForm((f) => ({ ...f, fromBranchId: v ?? f.fromBranchId }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>To branch</Label>
              <Select
                value={form.toBranchId}
                onValueChange={(v) => setForm((f) => ({ ...f, toBranchId: v ?? f.toBranchId }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches
                    .filter((b) => b.id !== form.fromBranchId)
                    .map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Product</Label>
              <Select
                value={form.productId}
                onValueChange={(v) => setForm((f) => ({ ...f, productId: v ?? f.productId }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-qty">Quantity</Label>
              <Input
                id="t-qty"
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !form.fromBranchId || !form.toBranchId || !form.productId}
              >
                {loading ? "Transferring..." : "Transfer stock"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function FormattedDate({ iso }: { iso: string }) {
  const [text, setText] = useState("")

  useEffect(() => {
    setText(
      new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    )
  }, [iso])

  return text || "—"
}

export function TransfersView({
  transfers,
  branches,
  products,
}: {
  transfers: TransferDetail[]
  branches: BranchWithStats[]
  products: ProductWithStock[]
}) {
  const [search, setSearch] = useState("")

  const filtered = transfers.filter((t) => {
    const q = search.toLowerCase()
    return (
      t.product_name.toLowerCase().includes(q) ||
      t.from_branch_name.toLowerCase().includes(q) ||
      t.to_branch_name.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search by product or branch..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <p className="text-sm text-muted-foreground">
          {filtered.length} transfer{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-border">
          <div className="flex flex-col items-center gap-2 p-12 text-center">
            <ArrowLeftRight className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">
              {search ? "No matching transfers" : "No transfers yet"}
            </p>
            <p className="text-sm text-muted-foreground">
              Move stock between branches using the New transfer button
            </p>
          </div>
        </Card>
      ) : (
        <Card className="border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.product_name}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        {t.from_branch_name}
                        <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                        {t.to_branch_name}
                      </span>
                    </TableCell>
                    <TableCell>{t.quantity}</TableCell>
                    <TableCell>
                      <Badge
                        variant={t.status === "completed" ? "default" : "secondary"}
                        className={
                          t.status === "completed"
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : ""
                        }
                      >
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <FormattedDate iso={t.created_at} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  )
}

TransfersView.NewTransferButton = NewTransferButton
