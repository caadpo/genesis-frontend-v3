import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = "http://localhost:3001/distribuicao";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tetoId = searchParams.get("tetoId");

  const token = (await cookies()).get("accessToken")?.value;

  const url = new URL(API_URL);
  if (tetoId) url.searchParams.append("tetoId", tetoId);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const data = await response.json();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const token = (await cookies()).get("accessToken")?.value;

  const response = await fetch(API_URL, {
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
