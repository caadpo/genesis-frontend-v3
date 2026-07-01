import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildApiResponse } from "@/src/lib/apiResponse";

const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/distribuicao`;

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

  return buildApiResponse(response);
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

  return buildApiResponse(response);
}
