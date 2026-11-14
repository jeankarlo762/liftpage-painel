import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { SESSION_COOKIE, signSession, verifySession } from "./session";

export async function createSession(userId: string) {
  const token = await signSession(userId);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function currentUserId() {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}

// Usuário logado com assinatura; redireciona para o login se não houver sessão.
export async function requireUser() {
  const id = await currentUserId();
  if (!id) redirect("/login");
  const user = await db.user.findUnique({
    where: { id },
    include: { subscription: true, connections: { select: { provider: true, accountName: true } } },
  });
  if (!user) redirect("/login");
  const plan = user.subscription?.plan ?? "BASIC";
  return { ...user, plan };
}
