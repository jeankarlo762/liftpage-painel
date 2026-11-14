"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { githubLogin } from "@/lib/services/github";
import { railwayWhoAmI } from "@/lib/services/railway";

type State = { error?: string; ok?: string } | undefined;

async function save(userId: string, provider: string, token: string, accountName: string) {
  await db.connection.upsert({
    where: { userId_provider: { userId, provider } },
    create: { userId, provider, tokenEnc: encrypt(token), accountName },
    update: { tokenEnc: encrypt(token), accountName },
  });
  revalidatePath("/configuracoes");
}

// Alternativa ao OAuth: token pessoal do GitHub (escopo "repo").
export async function connectGithubToken(_: State, form: FormData): Promise<State> {
  const user = await requireUser();
  const token = String(form.get("token") ?? "").trim();
  if (!token) return { error: "Cole o token" };
  try {
    const login = await githubLogin(token);
    await save(user.id, "github", token, login);
    return { ok: `Conectado como ${login}` };
  } catch {
    return { error: "Token do GitHub inválido" };
  }
}

export async function connectRailway(_: State, form: FormData): Promise<State> {
  const user = await requireUser();
  const token = String(form.get("token") ?? "").trim();
  if (!token) return { error: "Cole o token" };
  try {
    const name = await railwayWhoAmI(token);
    await save(user.id, "railway", token, name);
    return { ok: `Conectado: ${name}` };
  } catch {
    return { error: "Token do Railway inválido" };
  }
}

export async function disconnect(provider: string) {
  const user = await requireUser();
  await db.connection.deleteMany({ where: { userId: user.id, provider } });
  revalidatePath("/configuracoes");
}
