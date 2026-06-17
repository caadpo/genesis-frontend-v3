import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function POST(request: Request) {
  const token = (await cookies()).get("accessToken")?.value;
  const body = await request.json();

  const response = await fetch(`${API_URL}/user`, {
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

export async function PUT(request: Request) {
  const token = (await cookies()).get("accessToken")?.value;

  const body = await request.json();

  const response = await fetch(`${API_URL}/user/me/phone`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  return NextResponse.json(data, {
    status: response.status,
  });
}
