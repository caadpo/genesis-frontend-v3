import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildApiResponse } from "@/src/lib/apiResponse";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const diretoriaId = searchParams.get("diretoriaId");

  const token = (await cookies()).get("accessToken")?.value;

  const url = diretoriaId
    ? `${API_URL}/ome?diretoriaId=${diretoriaId}`
    : `${API_URL}/ome`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Erro ao buscar OMEs" },
      { status: response.status },
    );
  }

  return buildApiResponse(response);
}
