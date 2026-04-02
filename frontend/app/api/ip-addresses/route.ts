import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_API_BASE_URL = process.env.BACKEND_API_BASE_URL ?? "http://127.0.0.1:8002";

function buildAuthErrorResponse() {
  return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return buildAuthErrorResponse();
  }

  const url = new URL(request.url);
  const query = url.searchParams.toString();
  const target = `${BACKEND_API_BASE_URL}/api/ip-addresses${query ? `?${query}` : ""}`;

  const response = await fetch(target, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const payload = await response.text();

  return new NextResponse(payload, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
    },
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return buildAuthErrorResponse();
  }

  const body = await request.text();

  const response = await fetch(`${BACKEND_API_BASE_URL}/api/ip-addresses`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body,
    cache: "no-store",
  });

  const payload = await response.text();

  return new NextResponse(payload, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
    },
  });
}
