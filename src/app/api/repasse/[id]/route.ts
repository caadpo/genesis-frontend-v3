import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

// GET /api/repasse/[id]
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const token = (await cookies()).get("accessToken")?.value;

  const response = await fetch(`${API_URL}/repasse/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

// PATCH /api/repasse/[id]?acao=aceitar|cancelar
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const token = (await cookies()).get("accessToken")?.value;
  const { searchParams } = new URL(request.url);
  const acao = searchParams.get("acao"); // "aceitar" | "cancelar"

  if (acao !== "aceitar" && acao !== "cancelar") {
    return NextResponse.json(
      { error: 'Parâmetro "acao" deve ser "aceitar" ou "cancelar"' },
      { status: 400 },
    );
  }

  const response = await fetch(`${API_URL}/repasse/${id}/${acao}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
