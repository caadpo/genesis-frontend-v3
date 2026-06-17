// src/app/api/evento/[id]/bloqueio/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const token = (await cookies()).get("accessToken")?.value;
  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

  const response = await fetch(`${API_URL}/evento/${id}/bloqueio`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
