import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Deslogado com sucesso" });

  // Remove os cookies de autenticação
  response.cookies.set("accessToken", "", { path: "/", maxAge: 0 });
  response.cookies.set("userData", "", { path: "/", maxAge: 0 });

  return response;
}
