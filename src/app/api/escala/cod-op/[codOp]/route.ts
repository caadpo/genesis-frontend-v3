import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(
  _request: Request,
  context: { params: Promise<{ codOp: string }> },
) {
  const { codOp } = await context.params;
  const token = (await cookies()).get("accessToken")?.value;
  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

  const response = await fetch(`${API_URL}/escala/cod-op/${codOp}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
