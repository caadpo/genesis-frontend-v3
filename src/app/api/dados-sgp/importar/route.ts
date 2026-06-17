import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function POST(request: Request) {
  const token = (await cookies()).get("accessToken")?.value;
  const formData = await request.formData();

  const response = await fetch(`${API_URL}/dados-sgp/importar`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
