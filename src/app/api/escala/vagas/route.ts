import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

/** Vagas abertas destinadas à OME do usuário logado. Aceita ?operacaoId= */
export async function GET(request: Request) {
  const token = (await cookies()).get("accessToken")?.value;
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();

  const response = await fetch(`${API_URL}/escala/vagas${qs ? `?${qs}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
