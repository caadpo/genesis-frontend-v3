import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

  // ✅ NEXT 15 — cookies é async
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return NextResponse.json(null, { status: 401 });
  }

  const nestRes = await fetch(`${baseUrl}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!nestRes.ok) {
    return NextResponse.json(null, { status: 401 });
  }

  const user = await nestRes.json();

  return NextResponse.json(user);
}
