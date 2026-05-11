import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function GET(
  _request: Request,
  context: { params: Promise<{ eventoId: string }> },
) {
  const { eventoId } = await context.params;
  const token = (await cookies()).get("accessToken")?.value;

  const response = await fetch(`${API_URL}/pagamento/evento/${eventoId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ eventoId: string }> },
) {
  const { eventoId } = await context.params;
  const token = (await cookies()).get("accessToken")?.value;

  const response = await fetch(`${API_URL}/pagamento/evento/${eventoId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
