"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";

export type FormState = { error?: string } | undefined;

// Só aceita caminhos internos para o redirecionamento depois do login (ex.: /api/checkout/pro).
function safeNext(form: FormData, fallback: string) {
  const next = String(form.get("next") ?? "");
  return next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

const signupSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome"),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres"),
});

export async function signup(_: FormState, form: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse({ name: form.get("name"), email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, password } = parsed.data;
  if (await db.user.findUnique({ where: { email } })) return { error: "Já existe uma conta com esse e-mail" };
  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      // Sem assinatura até a compra: o acesso é liberado pelo webhook do Stripe.
    },
  });
  await createSession(user.id);
  redirect(safeNext(form, "/assinatura"));
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return { error: "E-mail ou senha incorretos" };
  await createSession(user.id);
  redirect(safeNext(form, "/dashboard"));
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
