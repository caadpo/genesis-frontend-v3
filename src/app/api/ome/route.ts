import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const diretoriaId = searchParams.get("diretoriaId");

  const token = (await cookies()).get("accessToken")?.value;

  const url = diretoriaId
    ? `http://localhost:3001/ome?diretoriaId=${diretoriaId}`
    : `http://localhost:3001/ome`;

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

  const data = await response.json();
  return NextResponse.json(data);
}
