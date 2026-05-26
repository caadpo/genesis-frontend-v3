// src/app/api/tetos/[id]/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    const response = await fetch(`http://localhost:3001/tetos/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar teto por id" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    const body = await request.json();

    const response = await fetch(`http://localhost:3001/tetos/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao atualizar teto" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    const response = await fetch(`http://localhost:3001/tetos/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Erro ao excluir teto" },
        { status: response.status },
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao excluir teto" },
      { status: 500 },
    );
  }
}
