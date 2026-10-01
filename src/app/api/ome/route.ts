import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildApiResponse } from "@/src/lib/apiResponse";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function GET(): Promise<NextResponse> {
  const token = (await cookies()).get("accessToken")?.value;
  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

  const response = await fetch(`${API_URL}/ome`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
