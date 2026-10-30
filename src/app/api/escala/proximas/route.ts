import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function GET(request: Request) {
  const token = (await cookies()).get("accessToken")?.value;

  const { searchParams } = new URL(request.url);
  const qs = new URLSearchParams();
  const hoje = searchParams.get("hoje");
  const limit = searchParams.get("limit");
  if (hoje) qs.set("hoje", hoje);
  if (limit) qs.set("limit", limit);
  const query = qs.toString();

  const response = await fetch(
    `${API_URL}/escala/proximas${query ? `?${query}` : ""}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  const data = await response.json().catch(() => null);
  return NextResponse.json(data, { status: response.status });
}
