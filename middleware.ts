import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const isSecure = request.nextUrl.protocol === "https:"
  // NextAuth v5 uses "authjs.session-token" (or "__Secure-authjs.session-token" on HTTPS)
  const cookieName = isSecure
    ? "__Secure-authjs.session-token"
    : "authjs.session-token"

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    cookieName,
  })

  if (!token) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
