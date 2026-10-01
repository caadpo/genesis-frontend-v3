// Salvar em: src/app/api/escala/[id]/verificacao/route.ts
//
// Recebe { numero: 1 | 2, observacao?: string, verificado?: boolean } e repassa
// para PATCH /escala/:id/verificacao1 ou /escala/:id/verificacao2 no backend.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const token = (await cookies()).get("accessToken")?.value;
  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

  const { numero, ...body } = await request.json();

  if (numero !== 1 && numero !== 2) {
    return NextResponse.json(
      { message: "Informe numero 1 ou 2" },
      { status: 400 },
    );
  }

  const response = await fetch(`${API_URL}/escala/${id}/verificacao${numero}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
