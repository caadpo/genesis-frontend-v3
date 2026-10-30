import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function GET(request: Request) {
  const token = (await cookies()).get("accessToken")?.value;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const query = status ? `?status=${encodeURIComponent(status)}` : "";

  const response = await fetch(`${API_URL}/repasse/meus${query}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);
  return NextResponse.json(data, { status: response.status });
}
