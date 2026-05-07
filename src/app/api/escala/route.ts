import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function GET(request: Request) {
  const token = (await cookies()).get("accessToken")?.value;
  const { searchParams } = new URL(request.url);
  const operacaoId = searchParams.get("operacaoId");

  const url = operacaoId
    ? `${API_URL}/escala?operacaoId=${operacaoId}`
    : `${API_URL}/escala`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function POST(request: Request) {
  const token = (await cookies()).get("accessToken")?.value;
  const body = await request.json();

  console.log("Creating escala with body:", body);

  try {
    const response = await fetch(`${API_URL}/escala`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Backend error response:", data);
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Error creating escala:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao criar escala" },
      { status: 500 },
    );
  }
}
