import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_ROUTE_PREFIX = "/dashboard";
const SESSION_COOKIE_NAME = "__session";
const LOGIN_PATH = "/login";

/**
 * Server-side route guard for dashboard pages.
 * Redirects unauthenticated requests before client bundles load.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith(PROTECTED_ROUTE_PREFIX)) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
