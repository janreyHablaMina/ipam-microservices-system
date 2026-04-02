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

const AUTH_API_BASE_URL = process.env.AUTH_API_BASE_URL ?? "http://127.0.0.1:8001";

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

  const response = await fetch(`${AUTH_API_BASE_URL}/api/login`, {
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

  if (authPayload.user.role !== "super_admin") {
    return NextResponse.json(
      {
        message: "You are authenticated, but your role is not authorized for this page.",
      },
      { status: 403 }
    );
  }

  const nextResponse = NextResponse.json({
    message: "Login successful",
    user: authPayload.user,
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
