import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const token = (await cookies()).get("accessToken")?.value;

  const response = await fetch(`${API_URL}/user/${id}/ativo`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
