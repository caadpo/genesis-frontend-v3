import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

/** Cria uma vaga em aberto (somente OME dona). */
export async function POST(request: Request) {
  const body = await request.json();
  const token = (await cookies()).get("accessToken")?.value;

  const response = await fetch(`${API_URL}/escala/vaga`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
