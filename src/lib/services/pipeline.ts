import type { PageStatus } from "@prisma/client";
import { db } from "../db";
import { planFeatures } from "../plans";
import { hostedUrl } from "../site";
import { buildSiteFiles } from "./bundle";
import { extractHtml, generateLandingHtml } from "./generator";
import { createRepoWithFiles } from "./github";
import { createProject, createServiceDomain, createServiceFromRepo, latestDeploymentStatus } from "./railway";

export function assetPublicPath(a: { id: string; kind: string; filename: string }) {
  const ext = a.filename.includes(".") ? a.filename.slice(a.filename.lastIndexOf(".")).toLowerCase() : "";
  return a.kind === "logo" ? `assets/logo${ext}` : `assets/${a.id.slice(-8)}${ext}`;
}

async function setStatus(pageId: string, status: PageStatus, note: string, extra: Record<string, unknown> = {}) {
  const page = await db.page.findUnique({ where: { id: pageId }, select: { statusLog: true } });
  const line = `[${new Date().toISOString()}] ${note}`;
  await db.page.update({
    where: { id: pageId },
    data: { status, statusLog: [page?.statusLog, line].filter(Boolean).join("\n"), ...extra },
  });
}

// Todas as páginas são publicadas nas contas de GitHub e Railway da plataforma (variáveis do servidor).
export async function hostingCredentials() {
  const github = process.env.PLATFORM_GITHUB_TOKEN;
  const railway = process.env.PLATFORM_RAILWAY_TOKEN;
  if (!github || !railway) throw new Error("A publicação ainda não foi configurada pela LiftPage. Fale com o suporte.");
  return {
    github,
    githubOwner: process.env.PLATFORM_GITHUB_OWNER || undefined,
    railway,
    workspaceId: process.env.PLATFORM_RAILWAY_WORKSPACE_ID || undefined,
    platform: true,
  };
}

// Fluxo completo de publicação. Roda em segundo plano; o status fica salvo na página.
export async function publishPage(pageId: string, pastedHtml?: string) {
  try {
    const page = await db.page.findUniqueOrThrow({
      where: { id: pageId },
      include: { assets: true, user: { include: { subscription: true } } },
    });
    const features = planFeatures(page.user.subscription?.plan);
    const assets = page.assets.map((a) => ({ ...a, publicPath: assetPublicPath(a) }));

    // Hospedada na LiftPage: não precisa de GitHub nem Railway.
    const creds = page.hostedByPlatform ? null : await hostingCredentials();
    let html: string;
    if (pastedHtml) {
      html = extractHtml(pastedHtml);
    } else {
      if (!features.agent) throw new Error("O agente de criação faz parte do plano Premium. Cole o código gerado no Claude.");
      await setStatus(pageId, "GENERATING", "Agente Claude criando a página");
      html = await generateLandingHtml(
        page.prompt,
        assets.map((a) => ({ publicPath: a.publicPath, mimeType: a.mimeType, data: Buffer.from(a.data) })),
      );
    }

    if (!creds) {
      const url = hostedUrl(page.slug);
      await setStatus(pageId, "LIVE", `No ar em ${url}`, { html, url, publishedAt: new Date(), error: null });
      return;
    }

    await setStatus(pageId, "PUSHING", "Criando repositório no GitHub");
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const files = buildSiteFiles({
      slug: page.slug,
      html,
      pageId,
      appUrl,
      assets: assets.map((a) => ({ publicPath: a.publicPath, data: Buffer.from(a.data) })),
    });
    const repo = await createRepoWithFiles({
      token: creds.github,
      owner: creds.githubOwner,
      name: `lp-${page.slug}`,
      description: `Landing page: ${page.name}`,
      files,
    });
    await setStatus(pageId, "DEPLOYING", `Repositório ${repo.fullName} criado. Subindo no Railway`, { repoUrl: repo.htmlUrl });

    const { projectId, environmentId } = await createProject(creds.railway, `lp-${page.slug}`, creds.workspaceId);
    const serviceId = await createServiceFromRepo(creds.railway, projectId, "site", repo.fullName);
    const domain = await createServiceDomain(creds.railway, serviceId, environmentId);
    await db.page.update({
      where: { id: pageId },
      data: { railwayProjectId: projectId, railwayServiceId: serviceId, railwayEnvironmentId: environmentId, url: `https://${domain}` },
    });

    // Acompanha o deploy por até ~10 minutos.
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 10_000));
      const st = await latestDeploymentStatus(creds.railway, serviceId, environmentId).catch(() => null);
      if (st === "SUCCESS") {
        await setStatus(pageId, "LIVE", `No ar em https://${domain}`, { publishedAt: new Date(), error: null });
        return;
      }
      if (st === "FAILED" || st === "CRASHED") throw new Error(`Deploy no Railway terminou com status ${st}`);
    }
    await setStatus(pageId, "DEPLOYING", "Deploy demorando mais que o normal; confira no painel do Railway");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await setStatus(pageId, "FAILED", `Erro: ${message}`, { error: message }).catch(() => {});
  }
}
