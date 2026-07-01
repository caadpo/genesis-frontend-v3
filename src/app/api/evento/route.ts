import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildApiResponse } from "@/src/lib/apiResponse";

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

  return buildApiResponse(response);
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

  return buildApiResponse(response);
}
