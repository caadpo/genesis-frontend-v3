import { NextRequest, NextResponse } from "next/server";
import { getToken, validateToken } from "@/src/lib/auth";

const publicRoutes = ["/login"];
const AUTH_HOME = "/select-system";

const ROTAS_BLOQUEADAS_TIPO_1 = [
  "/pjes",
  "/diarias",
  "/pjes-diretoria-select",
  "/pjes-escalas",
  "/diaria-diretoria-select",
  "/diarias-escalas",
];

const ROTAS_PERMITIDAS_DIARIAS = [
  "/diarias",
  "/diaria-diretoria-select",
  "/diarias-escalas",
];

function decodeJwtPayload(token: string): { typeUser?: number } {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const authToken = await getToken();
  const isPublicRoute = publicRoutes.includes(pathname);

  if (!authToken && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (authToken && !(await validateToken(authToken))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (authToken && isPublicRoute) {
    return NextResponse.redirect(new URL(AUTH_HOME, request.url));
  }

  if (pathname === "/") {
    if (!authToken)
      return NextResponse.redirect(new URL("/login", request.url));
    return NextResponse.redirect(new URL(AUTH_HOME, request.url));
  }

  // ─── Controle de acesso por typeUser ──────────────────────────────────────
  if (authToken) {
    const { typeUser } = decodeJwtPayload(authToken);

    if (
      typeUser === 1 &&
      ROTAS_BLOQUEADAS_TIPO_1.some((r) => pathname.startsWith(r))
    ) {
      return NextResponse.redirect(new URL("/sem-permissao", request.url));
    }

    if (typeUser === 5 || typeUser === 6) {
      const podeAcessar =
        ROTAS_PERMITIDAS_DIARIAS.some((r) => pathname.startsWith(r)) ||
        pathname === AUTH_HOME ||
        pathname === "/sem-permissao";

      if (!podeAcessar) {
        return NextResponse.redirect(new URL("/sem-permissao", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\..*|api).*)",
  ],
};
