import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { query } from "@/lib/db"
import type { Business, User } from "@/lib/types"

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase()
        const password = String(credentials?.password ?? "")
        if (!email || !password) return null

        const { rows } = await query<User & { password: string }>(
          "SELECT id, name, email, password FROM users WHERE email = $1 LIMIT 1",
          [email],
        )
        const user = rows[0]
        if (!user) return null

        const valid = await bcrypt.compare(password, user.password)
        if (!valid) return null

        const biz = await query<Business>(
          "SELECT id FROM businesses WHERE owner_id = $1 LIMIT 1",
          [user.id],
        )

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          businessId: biz.rows[0]?.id ?? null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        // @ts-expect-error custom field
        token.businessId = user.businessId ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        // @ts-expect-error custom field
        session.user.businessId = (token.businessId as string | null) ?? null
      }
      return session
    },
  },
})
