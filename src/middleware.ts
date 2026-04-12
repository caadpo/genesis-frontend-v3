import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/login"];
const REDIRECT_WHEN_NOT_AUTHENTICATED_ROUTE = "/login";
const REDIRECT_WHEN_AUTHENTICATED_ROUTE = "/select-system";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log("Middleware executou:", pathname);

  // Ignora arquivos internos e estáticos
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const authToken = request.cookies.get("accessToken")?.value;
  const isPublicRoute = publicRoutes.includes(pathname);

  // ❌ Não autenticado tentando acessar rota privada
  if (!authToken && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = REDIRECT_WHEN_NOT_AUTHENTICATED_ROUTE;
    return NextResponse.redirect(url);
  }

  // ✅ Autenticado tentando acessar login
  if (authToken && isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = REDIRECT_WHEN_AUTHENTICATED_ROUTE;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|robots.txt|api).*)"],
};
