// src/app/api/tetos/[id]/encerrar/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    const response = await fetch(`http://localhost:3001/tetos/${id}/encerrar`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao encerrar teto" },
      { status: 500 },
    );
  }
}
