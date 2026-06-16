"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Edit2, Check, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import type { InventoryDetail } from "@/lib/types"

function EditRow({
  row,
  onSave,
  onCancel,
}: {
  row: InventoryDetail
  onSave: (qty: number, threshold: number) => Promise<void>
  onCancel: () => void
}) {
  const [qty, setQty] = useState(String(row.quantity))
  const [threshold, setThreshold] = useState(String(row.low_stock_threshold))
  const [saving, setSaving] = useState(false)

  async function save() {
    const q = parseInt(qty, 10)
    const t = parseInt(threshold, 10)
    if (isNaN(q) || q < 0 || isNaN(t) || t < 0) {
      toast.error("Enter valid non-negative numbers")
      return
    }
    setSaving(true)
    await onSave(q, t)
    setSaving(false)
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{row.product_name}</TableCell>
      <TableCell className="text-muted-foreground">{row.sku}</TableCell>
      <TableCell>
        <Badge variant="secondary" className="text-xs">{row.category}</Badge>
      </TableCell>
      <TableCell>
        <Input
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="h-7 w-20 text-sm"
          type="number"
          min="0"
        />
      </TableCell>
      <TableCell>
        <Input
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          className="h-7 w-20 text-sm"
          type="number"
          min="0"
        />
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={save} disabled={saving}>
            <Check className="h-3.5 w-3.5 text-emerald-600" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onCancel}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function BranchInventoryTable({
  inventory,
  branchId,
  businessId,
}: {
  inventory: InventoryDetail[]
  branchId: string
  businessId: string
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)

  async function saveInventory(row: InventoryDetail, qty: number, threshold: number) {
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: row.product_id,
          branchId,
          quantity: qty,
          lowStockThreshold: threshold,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Inventory updated")
      setEditingId(null)
      startTransition(() => router.refresh())
    } catch {
      toast.error("Failed to update inventory")
    }
  }

  if (inventory.length === 0) {
    return (
      <Card className="border-border">
        <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
          <p className="text-sm font-medium text-foreground">No inventory tracked here yet</p>
          <p className="text-sm text-muted-foreground">
            Add products and set quantities from the Products page
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Threshold</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((row) =>
              editingId === row.inventory_id ? (
                <EditRow
                  key={row.inventory_id}
                  row={row}
                  onSave={(q, t) => saveInventory(row, q, t)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <TableRow key={row.inventory_id}>
                  <TableCell className="font-medium">{row.product_name}</TableCell>
                  <TableCell className="text-muted-foreground">{row.sku}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">{row.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        row.low_stock
                          ? "font-semibold text-amber-600 dark:text-amber-400"
                          : "text-foreground"
                      }
                    >
                      {row.quantity}
                    </span>
                    {row.low_stock && (
                      <AlertTriangle className="ml-1.5 inline h-3.5 w-3.5 text-amber-500" />
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.low_stock_threshold}</TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => setEditingId(row.inventory_id)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ),
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
