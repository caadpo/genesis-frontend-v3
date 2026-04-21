import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const token = (await cookies()).get("accessToken")?.value;

  const response = await fetch(
    `http://localhost:3001/user/${id}/reset-password`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json(
      { error: text || "Erro ao resetar senha" },
      { status: response.status }
    );
  }

  return NextResponse.json({ message: "Senha resetada para genesis" });
}
