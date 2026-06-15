import Link from "next/link"
import { redirect } from "next/navigation"
import { AuthShell } from "@/components/auth/auth-shell"
import { RegisterForm } from "@/components/auth/register-form"
import { auth } from "@/lib/auth"

export default async function RegisterPage() {
  const session = await auth()
  if (session?.user) redirect("/dashboard")

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
