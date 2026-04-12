import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { loginSei, password } = body;

    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

    // 🔁 Chama o backend
    const res = await fetch(`${baseUrl}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Connection: "close" },
      body: JSON.stringify({ loginSei, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || "Erro ao autenticar" },
        { status: res.status }
      );
    }

    const response = NextResponse.json({ user: data.user });

    const isProduction = process.env.NODE_ENV === "production";

    // 🔐 Cookie do token (SEGURANÇA)
    response.cookies.set("accessToken", data.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
      maxAge: 60 * 60 * 4, // 4 horas
    });

    // 👁️ Cookie para UI (NÃO sensível)
    response.cookies.set("userData", JSON.stringify(data.user), {
      httpOnly: false,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
      maxAge: 60 * 60 * 4,
    });

    return response;
  } catch (error) {
    console.error("Erro no login:", error);

    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
