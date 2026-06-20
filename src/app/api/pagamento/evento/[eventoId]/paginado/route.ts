import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function GET(
  request: Request,
  context: { params: Promise<{ eventoId: string }> },
) {
  const { eventoId } = await context.params;
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") ?? "1";
  const busca = searchParams.get("busca") ?? "";
  const token = (await cookies()).get("accessToken")?.value;

  const url = new URL(`${API_URL}/pagamento/evento/${eventoId}/paginado`);
  url.searchParams.set("page", page);
  if (busca) url.searchParams.set("busca", busca);

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
