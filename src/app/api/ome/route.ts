import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const token = (await cookies()).get("accessToken")?.value;

  const response = await fetch("http://localhost:3001/ome", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Erro ao buscar OMEs" },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}
