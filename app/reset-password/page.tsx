import Link from "next/link"
import { Suspense } from "react"
import { AuthShell } from "@/components/auth/auth-shell"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export const metadata = {
  title: "Reset password — ShelfSync",
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a strong password for your account."
      footer={
        <Link href="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      {/* useSearchParams requires Suspense */}
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  )
}
