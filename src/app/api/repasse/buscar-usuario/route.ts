import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function GET(req: NextRequest) {
  const token = (await cookies()).get("accessToken")?.value;
  const q = req.nextUrl.searchParams.get("q") ?? "";

  const response = await fetch(
    `${API_URL}/repasse/buscar-usuario?q=${encodeURIComponent(q)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
