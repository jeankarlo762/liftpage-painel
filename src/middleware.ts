import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "./lib/session";

// /api/checkout aceita quem ainda não tem conta (vem da landing page, paga e depois cria o login).
const PUBLIC = ["/login", "/cadastro", "/api/track", "/api/webhooks", "/api/checkout"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/landing.html") return NextResponse.redirect(new URL("/", req.url));
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();
  const userId = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!userId) {
    // Quem não está logado vê a landing page na raiz do site.
    if (pathname === "/") return NextResponse.rewrite(new URL("/landing.html", req.url));
    const url = new URL("/login", req.url);
    if (pathname !== "/" && pathname !== "/dashboard") url.searchParams.set("next", pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next|favicon.ico|.*\\.(?:png|svg|jpg|ico)$).*)"] };
