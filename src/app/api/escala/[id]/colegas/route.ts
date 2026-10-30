import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const token = (await cookies()).get("accessToken")?.value;

  const response = await fetch(`${API_URL}/escala/${id}/colegas`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);
  return NextResponse.json(data, { status: response.status });
}
