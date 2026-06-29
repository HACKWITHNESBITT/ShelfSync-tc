import { redirect } from "next/navigation"

export default function HomePage() {
  // No-auth mode: redirect to dashboard immediately
  redirect("/dashboard")
}
