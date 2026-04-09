// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Rotas públicas do sistema
const publicRoutes = [
  { path: "/login", whenAuthenticated: "redirect" },
] as const;

// Rota de redirecionamento se não estiver autenticado
const REDIRECT_WHEN_NOT_AUTHENTICATED_ROUTE = "/login";

// 🔐 Valida se a chave JWT está definida
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET não definido no .env.local");
}

// Converte a chave em Uint8Array para a biblioteca 'jose'
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignora rotas internas do Next e arquivos estáticos
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".gif") ||
    pathname.endsWith(".svg") ||
    pathname === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  const publicRoute = publicRoutes.find((route) => route.path === pathname);
  const authToken = request.cookies.get("accessToken")?.value;

  // 1️⃣ Rota pública sem token → segue
  if (!authToken && publicRoute) return NextResponse.next();

  // 2️⃣ Rota privada sem token → redireciona para /login
  if (!authToken && !publicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = REDIRECT_WHEN_NOT_AUTHENTICATED_ROUTE;
    return NextResponse.redirect(url);
  }

  // 3️⃣ Token presente + rota pública → redireciona para privada
  if (authToken && publicRoute?.whenAuthenticated === "redirect") {
    const url = request.nextUrl.clone();
    url.pathname = "/select-system"; // página privada
    return NextResponse.redirect(url);
  }

  // 4️⃣ Token presente + rota privada → valida JWT
  if (authToken && !publicRoute) {
    try {
      await jwtVerify(authToken, JWT_SECRET);
      return NextResponse.next(); // token válido
    } catch {
      const url = request.nextUrl.clone();
      url.pathname = REDIRECT_WHEN_NOT_AUTHENTICATED_ROUTE;

      const response = NextResponse.redirect(url);
      response.cookies.set("accessToken", "", { maxAge: 0, path: "/" });
      response.cookies.set("userData", "", { maxAge: 0, path: "/" });

      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|favicon.ico|robots.txt|_next/static|_next/image|api).*)",
  ],
};
