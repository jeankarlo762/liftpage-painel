"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasActiveAccess, planFeatures } from "@/lib/plans";
import { extractHtml } from "@/lib/services/generator";
import { agentConfigured } from "@/lib/services/generator";
import { hostingCredentials, publishPage } from "@/lib/services/pipeline";
import { deleteProject } from "@/lib/services/railway";

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
  if (!agentConfigured()) return { error: "O agente de criação ainda não foi configurado pela LiftPage. Fale com o suporte." };
  if (BUSY.includes(page.status)) return { error: "Essa página já está sendo publicada." };
  if (page.repoUrl) return { error: "Essa página já foi publicada." };
  const ready = page.hostedByPlatform ? null : await readyToPublish();
  if (ready) return { error: ready };
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
  const ready = page.hostedByPlatform ? null : await readyToPublish();
  if (ready) return { error: ready };
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

// Exclui a página: tira do ar (rota da LiftPage ou projeto no Railway) e apaga os dados.
export async function deletePage(pageId: string): Promise<{ error?: string }> {
  const { page } = await ownedPage(pageId);
  if (BUSY.includes(page.status)) return { error: "Espere a publicação terminar para excluir." };
  if (page.railwayProjectId && process.env.PLATFORM_RAILWAY_TOKEN) {
    await deleteProject(process.env.PLATFORM_RAILWAY_TOKEN, page.railwayProjectId).catch((e) =>
      console.error(`[excluir] não foi possível apagar o projeto ${page.railwayProjectId} no Railway`, e),
    );
  }
  await db.$transaction([db.asset.deleteMany({ where: { pageId } }), db.page.delete({ where: { id: pageId } })]);
  revalidatePath("/paginas");
  revalidatePath("/dashboard");
  return {};
}

// Confere as contas de publicação antes de começar, para o erro aparecer na hora.
async function readyToPublish() {
  try {
    await hostingCredentials();
    return null;
  } catch (e) {
    return (e as Error).message;
  }
}
