import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      businessId: string | null
    } & DefaultSession["user"]
  }

  interface User {
    businessId?: string | null
  }
}
