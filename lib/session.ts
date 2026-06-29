import { query } from "@/lib/db"
import { getDefaultBusinessId } from "@/lib/getDefaultBusinessId"
import type { Business } from "@/lib/types"

export interface CurrentContext {
  userId: string
  userName: string
  userEmail: string
  business: Business
}

/**
 * Public no-auth mode: returns the default/shared business workspace.
 * No session required. All data is scoped to a single default business.
 */
export async function requireContext(): Promise<CurrentContext> {
  const businessId = await getDefaultBusinessId()

  const { rows } = await query<Business>("SELECT * FROM businesses WHERE id = $1 LIMIT 1", [
    businessId,
  ])
  const business = rows[0]

  return {
    userId: "public",
    userName: "Guest",
    userEmail: "guest@shelfsync.local",
    business,
  }
}

/** API-route variant: same behavior, no auth needed. */
export async function getContext(): Promise<CurrentContext | null> {
  try {
    return await requireContext()
  } catch {
    return null
  }
}
