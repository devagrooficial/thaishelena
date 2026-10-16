import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, tokenValido } from "./lib/auth";

export function proxy(req: NextRequest) {
  if (tokenValido(req.cookies.get(COOKIE)?.value)) return NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ erro: "não autenticado" }, { status: 401 });
  }
  const url = new URL("/login", req.url);
  return NextResponse.redirect(url);
}

export const config = {
  // tudo, exceto a tela de login e arquivos estáticos
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
