"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Building2, User } from "lucide-react"

export function SettingsForm({
  businessId,
  initialName,
  initialThreshold,
  userName,
  userEmail,
}: {
  businessId: string
  initialName: string
  initialThreshold: number
  userName: string
  userEmail: string
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(initialName)
  const [threshold, setThreshold] = useState(String(initialThreshold))

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const t = parseInt(threshold, 10)
    if (isNaN(t) || t < 0) {
      toast.error("Threshold must be a non-negative number")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, defaultThreshold: t }),
      })
      if (!res.ok) throw new Error()
      toast.success("Settings saved")
      startTransition(() => router.refresh())
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      {/* Business settings */}
      <Card className="border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-primary">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">Business settings</CardTitle>
              <CardDescription className="text-xs">
                Configure your inventory preferences
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="biz-name">Business name</Label>
              <Input
                id="biz-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="biz-threshold">Default low-stock threshold</Label>
              <Input
                id="biz-threshold"
                type="number"
                min="0"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                New products will use this threshold by default. Existing inventory thresholds are not affected.
              </p>
            </div>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account info */}
      <Card className="border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-primary">
              <User className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">Account</CardTitle>
              <CardDescription className="text-xs">Your personal details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={userName} disabled className="bg-muted/50" />
          </div>
          <Separator />
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={userEmail} disabled className="bg-muted/50" />
          </div>
          <p className="text-xs text-muted-foreground">
            Account details cannot be changed. Contact support if you need to update your email.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
