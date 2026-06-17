import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const token = (await cookies()).get("accessToken")?.value;

  const response = await fetch(`${API_URL}/user/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Erro ao buscar usuário" },
      { status: response.status },
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const token = (await cookies()).get("accessToken")?.value;
  const body = await request.json();

  const response = await fetch(`${API_URL}/user/${id}`, {
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

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const token = (await cookies()).get("accessToken")?.value;

  const response = await fetch(`${API_URL}/user/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
