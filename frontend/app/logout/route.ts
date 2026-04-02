import { NextResponse } from "next/server";

function buildLogoutResponse() {
  const response = NextResponse.json(
    { message: "Logged out successfully." },
    { status: 200 }
  );

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

export async function GET() {
  return buildLogoutResponse();
}

export async function POST() {
  return buildLogoutResponse();
}
