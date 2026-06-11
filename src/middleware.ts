/**
 * @module middleware
 * @description Next.js Edge Middleware for route protection.
 *
 * Protects `/dashboard/*` routes by checking for a Firebase authentication
 * session cookie (`__session`). Unauthenticated users are redirected to `/login`
 * with a `callbackUrl` query parameter so they return to the intended page
 * after signing in.
 *
 * Note: This middleware runs at the Edge and cannot import the Firebase Admin SDK.
 * It performs a lightweight cookie-presence check. Full token verification should
 * happen in server components or API routes using the Admin SDK.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */
import { NextResponse, type NextRequest } from "next/server";

/**
 * Routes that require authentication.
 * Uses Next.js matcher syntax for efficient edge-level matching.
 */
const PROTECTED_ROUTE_PREFIX = "/dashboard";

/** Name of the Firebase session cookie set after client-side login */
const SESSION_COOKIE_NAME = "__session";

/**
 * The login page path where unauthenticated users are redirected.
 * Must NOT be a protected route to avoid redirect loops.
 */
const LOGIN_PATH = "/login";

/**
 * Checks whether the incoming request targets a protected route
 * and redirects unauthenticated users to the login page.
 *
 * @param request - The incoming Next.js request
 * @returns A redirect response for unauthenticated users, or `NextResponse.next()` to continue
 */
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Only protect dashboard routes
  if (!pathname.startsWith(PROTECTED_ROUTE_PREFIX)) {
    return NextResponse.next();
  }

  // Check for Firebase session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/**
 * Next.js middleware matcher configuration.
 * Restricts middleware execution to dashboard routes only,
 * excluding static files, images, and API routes for performance.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
 */
export const config = {
  matcher: ["/dashboard/:path*"],
};
