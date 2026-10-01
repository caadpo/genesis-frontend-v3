import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildApiResponse } from "@/src/lib/apiResponse";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function GET(request: Request): Promise<NextResponse> {
  const token = (await cookies()).get("accessToken")?.value;
  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();

  const response = await fetch(`${API_URL}/evento${qs ? `?${qs}` : ""}`, {
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

  return buildApiResponse(response);
}
