import Link from "next/link"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { AuthShell } from "@/components/auth/auth-shell"
import { RegisterForm } from "@/components/auth/register-form"

export default async function RegisterPage() {
  const cookieStore = await cookies()
  const hasSession =
    cookieStore.has("authjs.session-token") ||
    cookieStore.has("__Secure-authjs.session-token") ||
    cookieStore.has("next-auth.session-token")
  if (hasSession) redirect("/dashboard")

  return (
    <AuthShell
      title="Create your workspace"
      subtitle="Start managing inventory across all your branches. Demo data included."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  )
}
