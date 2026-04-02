import { NextResponse } from "next/server";

type AuthServiceLoginResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: number;
    name: string;
    email: string;
    role?: string;
  };
};

const GATEWAY_API_BASE_URL = process.env.GATEWAY_API_BASE_URL ?? "http://127.0.0.1:8000";
type AppRole = "super_admin" | "user";

function getDashboardPath(role: AppRole): string {
  return role === "super_admin" ? "/admin/audit-logs" : "/user/dashboard";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;

  if (!body?.email || !body?.password) {
    return NextResponse.json(
      { message: "Email and password are required." },
      { status: 422 }
    );
  }

  const response = await fetch(`${GATEWAY_API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: body.email,
      password: body.password,
    }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | AuthServiceLoginResponse
    | { message?: string; errors?: unknown }
    | null;

  if (!response.ok) {
    return NextResponse.json(
      {
        message:
          (payload as { message?: string } | null)?.message ??
          `Login failed (${response.status})`,
        errors: (payload as { errors?: unknown } | null)?.errors ?? null,
      },
      { status: response.status }
    );
  }

  const authPayload = payload as AuthServiceLoginResponse;

  const role = authPayload.user.role;

  if (role !== "super_admin" && role !== "user") {
    return NextResponse.json(
      {
        message: "You are authenticated, but your role is not authorized for this application.",
      },
      { status: 403 }
    );
  }

  const nextResponse = NextResponse.json({
    message: "Login successful",
    user: authPayload.user,
    redirectTo: getDashboardPath(role),
  });

  nextResponse.cookies.set({
    name: "token",
    value: authPayload.access_token,
    path: "/",
    maxAge: authPayload.expires_in,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  return nextResponse;
}
