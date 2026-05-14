import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function GET(request: Request) {
  const token = (await cookies()).get("accessToken")?.value;
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo");

  const endpoint =
    tipo === "meus"
      ? `${API_URL}/repasse/meus`
      : tipo === "disponiveis"
        ? `${API_URL}/repasse/disponiveis`
        : `${API_URL}/repasse`; // sem tipo → lista todos

  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

// POST /api/repasse  — criar repasse
export async function POST(request: Request) {
  const token = (await cookies()).get("accessToken")?.value;
  const body = await request.json();

  try {
    const response = await fetch(`${API_URL}/repasse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao criar repasse" },
      { status: 500 },
    );
  }
}
