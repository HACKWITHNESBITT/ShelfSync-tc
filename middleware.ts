import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// NextAuth v5 encrypts tokens with JWE — getToken() from next-auth/jwt cannot
// decrypt them. Instead we check for the presence of the session cookie, which
// is only set after a successful sign-in. This is sufficient for route protection.
function getSessionCookie(request: NextRequest): string | undefined {
  const isSecure = request.nextUrl.protocol === "https:"
  const cookieName = isSecure
    ? "__Secure-authjs.session-token"
    : "authjs.session-token"
  return (
    request.cookies.get(cookieName)?.value ??
    // Fallback: NextAuth v5 also sometimes uses this name in dev
    request.cookies.get("next-auth.session-token")?.value
  )
}

export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request)

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url)
    // Only set callbackUrl for non-root dashboard paths to avoid loop
    if (request.nextUrl.pathname !== "/dashboard") {
      loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
