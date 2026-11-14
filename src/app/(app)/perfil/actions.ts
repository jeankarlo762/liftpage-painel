"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

type State = { error?: string; ok?: string } | undefined;

const profileSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome"),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  phone: z.string().trim().optional(),
  company: z.string().trim().optional(),
  document: z.string().trim().optional(),
});

export async function updateProfile(_: State, form: FormData): Promise<State> {
  const user = await requireUser();
  const p = profileSchema.safeParse(Object.fromEntries(form));
  if (!p.success) return { error: p.error.issues[0].message };
  const other = await db.user.findUnique({ where: { email: p.data.email } });
  if (other && other.id !== user.id) return { error: "Esse e-mail já está em uso" };
  await db.user.update({ where: { id: user.id }, data: p.data });
  revalidatePath("/", "layout");
  return { ok: "Dados salvos" };
}

export async function changePassword(_: State, form: FormData): Promise<State> {
  const user = await requireUser();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  if (next.length < 8) return { error: "A nova senha precisa ter pelo menos 8 caracteres" };
  if (!(await bcrypt.compare(current, user.passwordHash))) return { error: "Senha atual incorreta" };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 10) } });
  return { ok: "Senha alterada" };
}
