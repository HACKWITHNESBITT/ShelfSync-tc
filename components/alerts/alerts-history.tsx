import { CheckCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { AlertDetail } from "@/lib/types"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function AlertsHistory({ alerts }: { alerts: AlertDetail[] }) {
  if (alerts.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          No resolved alerts yet
        </CardContent>
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
              <TableHead>Branch</TableHead>
              <TableHead>Qty at alert</TableHead>
              <TableHead>Threshold</TableHead>
              <TableHead>Raised</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.map((a) => (
              <TableRow key={a.id} className="opacity-70">
                <TableCell className="font-medium">{a.product_name}</TableCell>
                <TableCell className="text-muted-foreground">{a.sku}</TableCell>
                <TableCell>{a.branch_name}</TableCell>
                <TableCell>{a.quantity}</TableCell>
                <TableCell>{a.low_stock_threshold}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(a.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
