import { NextResponse } from "next/server";
import { z } from "zod";

const loginSchema = z.object({
  mat: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const nestRes = await fetch("http://localhost:3001/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
  });

  const data = await nestRes.json();

  if (!nestRes.ok) {
    return NextResponse.json(data, { status: nestRes.status });
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set("accessToken", data.accessToken, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
  });

  return response;
}
