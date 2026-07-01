// src/app/api/conta/pendentes-efisco/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function GET() {
  const token = (await cookies()).get("accessToken")?.value;

  const response = await fetch(`${API_URL}/conta/pendentes-efisco`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
