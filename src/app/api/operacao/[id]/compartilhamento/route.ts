import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

/** Lista as OMEs com quem a operação é compartilhada: [{ id, nomeOme }] */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const token = (await cookies()).get("accessToken")?.value;

  const response = await fetch(`${API_URL}/operacao/${id}/compartilhamento`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

/** Substitui a lista COMPLETA de OMEs compartilhadas. Body: { omeIds: number[] } */
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = await request.json();
  const token = (await cookies()).get("accessToken")?.value;

  const response = await fetch(`${API_URL}/operacao/${id}/compartilhamento`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
