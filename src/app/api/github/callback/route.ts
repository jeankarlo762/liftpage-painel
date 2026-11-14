import { NextResponse, type NextRequest } from "next/server";
import { currentUserId } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import { githubLogin } from "@/lib/services/github";

export async function GET(req: NextRequest) {
  const back = (s: string) => {
    const res = NextResponse.redirect(new URL(`/configuracoes?github=${s}`, process.env.APP_URL ?? req.url));
    res.cookies.delete("gh_oauth_state");
    return res;
  };
  const userId = await currentUserId();
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!userId || !code || !state || state !== req.cookies.get("gh_oauth_state")?.value) return back("erro");

  const r = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code }),
  });
  const data = (await r.json().catch(() => ({}))) as { access_token?: string };
  if (!data.access_token) return back("erro");

  const login = await githubLogin(data.access_token);
  await db.connection.upsert({
    where: { userId_provider: { userId, provider: "github" } },
    create: { userId, provider: "github", tokenEnc: encrypt(data.access_token), accountName: login },
    update: { tokenEnc: encrypt(data.access_token), accountName: login },
  });
  return back("ok");
}
