import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const token = (await cookies()).get("accessToken")?.value;

  const response = await fetch(`http://localhost:3001/users/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  // 🔥 TRATAMENTO QUE FALTAVA
  if (!response.ok) {
    return NextResponse.json(
      { error: "Erro ao buscar usuário" },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}
