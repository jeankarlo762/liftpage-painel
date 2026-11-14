"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasActiveAccess, planFeatures } from "@/lib/plans";
import { extractHtml } from "@/lib/services/generator";
import { publishPage } from "@/lib/services/pipeline";

async function ownedPage(pageId: string) {
  const user = await requireUser();
  const page = await db.page.findFirst({ where: { id: pageId, userId: user.id } });
  if (!page) throw new Error("Página não encontrada");
  return { user, page };
}

const BUSY = ["GENERATING", "PUSHING", "DEPLOYING"];

export async function savePrompt(pageId: string, prompt: string) {
  await ownedPage(pageId);
  await db.page.update({ where: { id: pageId }, data: { prompt } });
  revalidatePath(`/paginas/${pageId}`);
}

// Premium: o agente Claude gera e publica sozinho.
export async function publishWithAgent(pageId: string): Promise<{ error?: string }> {
  const { user, page } = await ownedPage(pageId);
  if (!hasActiveAccess(user.subscription)) return { error: "Seu acesso não está ativo. Veja a tela Assinatura." };
  if (!planFeatures(user.plan).agent) return { error: "O agente de criação está disponível no plano Premium." };
  if (BUSY.includes(page.status)) return { error: "Essa página já está sendo publicada." };
  if (page.repoUrl) return { error: "Essa página já foi publicada." };
  await db.page.update({ where: { id: pageId }, data: { status: "GENERATING", error: null, statusLog: null } });
  after(() => publishPage(pageId));
  revalidatePath(`/paginas/${pageId}`);
  return {};
}

// Pro: o cliente cola o HTML que o Claude gerou e nós publicamos.
export async function publishPasted(pageId: string, html: string): Promise<{ error?: string }> {
  const { user, page } = await ownedPage(pageId);
  if (!hasActiveAccess(user.subscription)) return { error: "Seu acesso não está ativo. Veja a tela Assinatura." };
  if (BUSY.includes(page.status)) return { error: "Essa página já está sendo publicada." };
  if (page.repoUrl) return { error: "Essa página já foi publicada." };
  try {
    extractHtml(html);
  } catch (e) {
    return { error: (e as Error).message };
  }
  await db.page.update({ where: { id: pageId }, data: { status: "PUSHING", error: null, statusLog: null } });
  after(() => publishPage(pageId, html));
  revalidatePath(`/paginas/${pageId}`);
  return {};
}

export async function deleteDraft(pageId: string) {
  const { page } = await ownedPage(pageId);
  if (page.status !== "DRAFT" && page.status !== "FAILED") throw new Error("Só é possível excluir rascunhos ou páginas com erro");
  await db.page.delete({ where: { id: pageId } });
  revalidatePath("/paginas");
}
