import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const token = (await cookies()).get("accessToken")?.value;

  const response = await fetch(`${API_URL}/user/${id}/reset-password`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json(
      { error: text || "Erro ao resetar senha" },
      { status: response.status },
    );
  }

  return NextResponse.json({ message: "Senha resetada para genesis" });
}
