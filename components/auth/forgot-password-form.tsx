"use client"

import { useState } from "react"
import { Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  // In dev we surface the link directly so no email config is needed
  const [devLink, setDevLink] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const email = String(form.get("email") ?? "")

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.")
        return
      }

      setSubmitted(true)
      // Show the link directly in dev / when no email provider is set up
      if (data.resetUrl) {
        setDevLink(data.resetUrl)
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-lg bg-accent p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">Check your inbox</p>
            <p className="text-sm text-muted-foreground">
              If an account exists for that email, we&apos;ve sent a password reset link.
              It expires in 1 hour.
            </p>
          </div>
        </div>
        {devLink && (
          <div className="rounded-lg border border-border bg-muted p-3">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              No email provider configured — use this link directly:
            </p>
            <a
              href={devLink}
              className="break-all text-xs text-primary underline underline-offset-2"
            >
              {devLink}
            </a>
          </div>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
        />
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" className="mt-2 w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Send reset link
      </Button>
    </form>
  )
}
