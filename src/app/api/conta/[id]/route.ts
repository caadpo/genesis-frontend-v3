import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await request.json();
  const token = (await cookies()).get("accessToken")?.value;

  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

  const response = await fetch(`${API_URL}/conta/${id}`, {
    method: "PATCH", // 👈 IMPORTANTE
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
