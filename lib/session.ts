import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { query } from "@/lib/db"
import type { Business } from "@/lib/types"

export interface CurrentContext {
  userId: string
  userName: string
  userEmail: string
  business: Business
}

/**
 * Resolves the authenticated user and their business.
 * Redirects to /login if unauthenticated. Every data query in the app
 * is scoped by the returned business.id — there is no RLS on Aurora.
 */
export async function requireContext(): Promise<CurrentContext> {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { rows } = await query<Business>(
    "SELECT * FROM businesses WHERE owner_id = $1 LIMIT 1",
    [session.user.id],
  )
  const business = rows[0]
  if (!business) redirect("/login")

  return {
    userId: session.user.id,
    userName: session.user.name ?? "",
    userEmail: session.user.email ?? "",
    business,
  }
}

/** API-route variant: returns null instead of redirecting. */
export async function getContext(): Promise<CurrentContext | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  const { rows } = await query<Business>(
    "SELECT * FROM businesses WHERE owner_id = $1 LIMIT 1",
    [session.user.id],
  )
  const business = rows[0]
  if (!business) return null

  return {
    userId: session.user.id,
    userName: session.user.name ?? "",
    userEmail: session.user.email ?? "",
    business,
  }
}
