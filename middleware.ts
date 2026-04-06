import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Lista de rotas públicas que não precisam de autenticação
const PUBLIC_PATHS = ["/login"];

export function middleware(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  const { pathname } = req.nextUrl;

  // Se a rota estiver nas públicas, permite acesso
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Se não houver token e a rota não é pública → redireciona para login
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Token presente → permite continuar
  return NextResponse.next();
}

// Esse matcher vai fazer o middleware rodar em todas as páginas
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};