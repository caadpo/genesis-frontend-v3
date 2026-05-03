import { NextRequest, NextResponse } from "next/server";
import { getToken, validateToken } from "@/src/lib/auth";

const publicRoutes = ["/login"];

const AUTH_HOME = "/select-system";

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
    if (!authToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.redirect(new URL(AUTH_HOME, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\..*|api).*)",
  ],
};
