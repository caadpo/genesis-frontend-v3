import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(
  request: Request,
  context: { params: Promise<{ usuarioId: string }> },
) {
  const { usuarioId } = await context.params;
  const { searchParams } = new URL(request.url);
  const sistema = searchParams.get("sistema");

  const token = (await cookies()).get("accessToken")?.value;
  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

  const response = await fetch(
    `${API_URL}/escala/usuario/${usuarioId}?sistema=${sistema}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
