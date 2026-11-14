"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import { applyPaidSession, sessionAlreadyUsed, sessionPaid, sessionPlan } from "@/lib/billing";
import { stripe } from "@/lib/stripe";

export type FormState = { error?: string } | undefined;

// Só aceita caminhos internos para o redirecionamento depois do login (ex.: /api/checkout/pro).
function safeNext(form: FormData, fallback: string) {
  const next = String(form.get("next") ?? "");
  return next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

const signupSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("E-mail inválido"),
    password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "As senhas não conferem" });

export type SignupState = { error?: string; ok?: boolean } | undefined;

// Cria o login depois do pagamento. O pagamento é conferido direto no Stripe e cada pagamento libera uma conta só.
export async function completeSignup(_: SignupState, form: FormData): Promise<SignupState> {
  const sessionId = String(form.get("session_id") ?? "");
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return { error: "Pagamento não encontrado" };
  const session = await stripe().checkout.sessions.retrieve(sessionId).catch(() => null);
  if (!session || !sessionPlan(session) || !sessionPaid(session)) return { error: "Pagamento não confirmado" };
  if (await sessionAlreadyUsed(session)) return { error: "Esse pagamento já tem um login. Use a tela Entrar." };

  const stripeEmail = session.customer_details?.email ?? session.customer_email ?? null;
  const parsed = signupSchema.safeParse({ email: stripeEmail ?? form.get("email"), password: form.get("password"), confirm: form.get("confirm") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, password } = parsed.data;
  if (await db.user.findUnique({ where: { email } })) return { error: "Já existe um login com esse e-mail. Use a tela Entrar." };

  const name = session.customer_details?.name?.trim() || email.split("@")[0];
  const user = await db.user.create({ data: { name, email, passwordHash: await bcrypt.hash(password, 10) } });
  await applyPaidSession(session, user.id);
  await createSession(user.id);
  return { ok: true };
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
