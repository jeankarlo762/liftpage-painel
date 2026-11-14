import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

// Inicia o OAuth do GitHub (escopo "repo" para criar repositórios em nome do cliente).
export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) return NextResponse.redirect(new URL("/configuracoes?github=erro", process.env.APP_URL));
  const state = randomBytes(16).toString("hex");
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("scope", "repo");
  url.searchParams.set("state", state);
  url.searchParams.set("redirect_uri", `${process.env.APP_URL}/api/github/callback`);
  const res = NextResponse.redirect(url);
  res.cookies.set("gh_oauth_state", state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 600, path: "/" });
  return res;
}
