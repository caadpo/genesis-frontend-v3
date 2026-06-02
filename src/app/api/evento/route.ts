import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function GET(request: Request) {
  const token = (await cookies()).get("accessToken")?.value;
  const { searchParams } = new URL(request.url);

  const params = new URLSearchParams();
  const distribuicaoId = searchParams.get("distribuicaoId");
  const omeId = searchParams.get("omeId");

  if (distribuicaoId) params.set("distribuicaoId", distribuicaoId);
  if (omeId) params.set("omeId", omeId);

  const url = `${API_URL}/evento${params.size ? `?${params.toString()}` : ""}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function POST(request: Request) {
  const body = await request.json();
  const token = (await cookies()).get("accessToken")?.value;

  const response = await fetch(`${API_URL}/evento`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  return NextResponse.json(data, { status: response.status });
}
