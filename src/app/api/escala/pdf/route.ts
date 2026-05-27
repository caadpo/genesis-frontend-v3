import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function GET(request: Request) {
  const token = (await cookies()).get("accessToken")?.value;
  const { searchParams } = new URL(request.url);
  const operacaoId = searchParams.get("operacaoId");

  const response = await fetch(
    `${API_URL}/escala/pdf?operacaoId=${operacaoId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  }

  const buffer = await response.arrayBuffer();
  const disposition = response.headers.get("Content-Disposition") ?? "";

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition,
    },
  });
}
