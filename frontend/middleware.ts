import { NextRequest, NextResponse } from "next/server";

type AppRole = "super_admin" | "user";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const payloadString = atob(padded);
    return JSON.parse(payloadString) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getRole(payload: Record<string, unknown> | null): AppRole | null {
  const role = payload?.role;
  if (role === "super_admin" || role === "user") {
    return role;
  }

  return null;
}

function getRoleHome(role: AppRole): string {
  return role === "super_admin" ? "/admin/audit-logs" : "/user/dashboard";
}

function redirectAndClearToken(request: NextRequest, pathname: string) {
  const response = NextResponse.redirect(new URL(pathname, request.url));
  response.cookies.set({
    name: "token",
    value: "",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  const isAdminRoute = pathname.startsWith("/admin");
  const isUserRoute = pathname.startsWith("/user");
  const isLoginLikeRoute = pathname === "/" || pathname === "/login";
  const isProtectedRoute = isAdminRoute || isUserRoute;

  if (!token) {
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  }

  const payload = decodeJwtPayload(token);
  const role = getRole(payload);

  if (!role) {
    return redirectAndClearToken(request, "/login");
  }

  const exp = payload?.exp;
  if (typeof exp === "number" && exp * 1000 < Date.now()) {
    return redirectAndClearToken(request, "/login");
  }

  if (isLoginLikeRoute) {
    return NextResponse.redirect(new URL(getRoleHome(role), request.url));
  }

  if (isAdminRoute && role !== "super_admin") {
    return NextResponse.redirect(new URL("/user/dashboard", request.url));
  }

  if (isUserRoute && role !== "user") {
    return NextResponse.redirect(new URL("/admin/audit-logs", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/admin/:path*", "/user/:path*"],
};
