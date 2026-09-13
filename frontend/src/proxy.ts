import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicAuthRoutes = [
  "/login",
  "/register",
  "/verify",
  "/forgot-password",
  "/reset-password",
];

const protectedRoutes = ["/admin", "/instructor", "/student", "/profile", "/settings"];

// Edge-compatible JWT Payload Decoder & Expiry Validator
function isTokenValid(token?: string): boolean {
  if (!token) return false;
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return false;
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = atob(base64);
    const parsed = JSON.parse(jsonPayload);
    if (!parsed || typeof parsed !== "object") return false;
    // Check if token has expired
    if (parsed.exp && Date.now() >= parsed.exp * 1000) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function getUserRoleFromToken(token?: string): string | null {
  if (!token || !isTokenValid(token)) return null;
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = atob(base64);
    const parsed = JSON.parse(jsonPayload);
    return parsed?.role || null;
  } catch {
    return null;
  }
}

function getRoleDashboard(role?: string | null): string {
  if (role === "OWNER" || role === "SUPPORT_AGENT" || role === "ADMIN") return "/admin";
  return "/admin";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get("access_token")?.value;
  const isAuthenticated = isTokenValid(accessToken);
  const userRole = getUserRoleFromToken(accessToken);

  const isPublicAuthRoute = publicAuthRoutes.some((route) => pathname.startsWith(route));

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // 1. If authenticated and accessing login/register, redirect to role dashboard
  if (isAuthenticated && isPublicAuthRoute) {
    const targetDashboard = getRoleDashboard(userRole);
    return NextResponse.redirect(new URL(targetDashboard, request.url));
  }

  // 2. If NOT authenticated and trying to access protected routes, redirect to login
  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Role Authorization Checks for Protected Routes
  if (isAuthenticated && isProtectedRoute) {
    // Admin Route Protection
    if (
      pathname.startsWith("/admin") &&
      userRole !== "OWNER" &&
      userRole !== "SUPPORT_AGENT" &&
      userRole !== "ADMIN"
    ) {
      const fallbackDashboard = getRoleDashboard(userRole);
      return NextResponse.redirect(new URL(fallbackDashboard, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, public files
     */
    "/((?!api|_next/static|_next/image|images|favicon.ico).*)",
  ],
};
