import Link from "next/link"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/auth/login-form"

export default async function LoginPage() {
  // If the session cookie is already present, skip the login page.
  const cookieStore = await cookies()
  const hasSession =
    cookieStore.has("authjs.session-token") ||
    cookieStore.has("__Secure-authjs.session-token") ||
    cookieStore.has("next-auth.session-token")
  if (hasSession) redirect("/dashboard")

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your ShelfSync workspace."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  )
}
