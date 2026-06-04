import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function GET(request: NextRequest) {
  const token = (await cookies()).get("accessToken")?.value;

  const operacaoId = request.nextUrl.searchParams.get("operacaoId");
  const url = operacaoId
    ? `${API_URL}/viatura?operacaoId=${operacaoId}`
    : `${API_URL}/viatura`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
