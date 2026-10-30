import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function GET(request: Request) {
  const token = (await cookies()).get("accessToken")?.value;

  // Repassa mes/ano para o backend
  const { searchParams } = new URL(request.url);
  const qs = new URLSearchParams();
  const mes = searchParams.get("mes");
  const ano = searchParams.get("ano");
  if (mes) qs.set("mes", mes);
  if (ano) qs.set("ano", ano);
  const query = qs.toString();

  const response = await fetch(
    `${API_URL}/escala/minhas${query ? `?${query}` : ""}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  const data = await response.json().catch(() => null);
  return NextResponse.json(data, { status: response.status });
}
