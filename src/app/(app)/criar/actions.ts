"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isNicheAllowed } from "@/lib/niches";
import { hasActiveAccess, planFeatures } from "@/lib/plans";
import { briefingSchema, buildPrompt } from "@/lib/prompt";
import { assetPublicPath } from "@/lib/services/pipeline";

const MAX_FILE = 4 * 1024 * 1024;
const MAX_IMAGES = 8;
const OK_TYPES = /^image\/(png|jpeg|webp|gif|svg\+xml)$/;

function slugify(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "pagina";
}

export async function createDraft(form: FormData): Promise<{ error: string } | void> {
  const user = await requireUser();
  const plan = planFeatures(user.plan);
  if (!hasActiveAccess(user.subscription)) return { error: "Seu acesso não está ativo. Veja a tela Assinatura." };

  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("briefing") ?? "{}"));
  } catch {
    return { error: "Dados do questionário inválidos" };
  }
  const parsed = briefingSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const b = parsed.data;

  const clientName = String(form.get("clientName") ?? "").trim();
  const amountPaid = Number(form.get("amountPaid"));
  const domain = String(form.get("domain") ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (clientName.length < 2) return { error: "Informe o nome do cliente" };
  if (!String(form.get("amountPaid") ?? "") || !Number.isFinite(amountPaid) || amountPaid < 0 || amountPaid > 10_000_000) return { error: "Informe quanto o cliente pagou" };
  if (domain && !/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(domain)) return { error: "Domínio inválido. Use algo como meusite.com.br" };

  // Limites do plano, conferidos no servidor.
  if (!isNicheAllowed(user.plan, b.niche)) return { error: `Esse nicho não está incluído no plano ${plan.label}.` };
  if (b.siteType === "SECTIONS" && !plan.sections) return { error: "Sites com sessões estão disponíveis a partir do plano Pro." };

  const logo = form.get("logo");
  const images = form.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  const files: { kind: string; file: File }[] = [
    ...(logo instanceof File && logo.size > 0 ? [{ kind: "logo", file: logo }] : []),
    ...images.slice(0, MAX_IMAGES).map((file) => ({ kind: "image", file })),
  ];
  for (const { file } of files) {
    if (!OK_TYPES.test(file.type)) return { error: `Formato não suportado: ${file.name}` };
    if (file.size > MAX_FILE) return { error: `${file.name} passa de 4 MB` };
  }

  let slug = slugify(b.businessName);
  if (await db.page.findUnique({ where: { slug } })) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const page = await db.page.create({
    data: {
      userId: user.id,
      name: b.businessName,
      clientName,
      domain: domain || null,
      amountPaid,
      slug,
      niche: b.niche,
      siteType: b.siteType,
      template: b.template,
      colors: b.colors,
      briefing: b,
      prompt: "",
    },
  });

  const saved = [];
  for (const { kind, file } of files) {
    const asset = await db.asset.create({
      data: {
        userId: user.id,
        pageId: page.id,
        kind,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        data: Buffer.from(await file.arrayBuffer()),
      },
      select: { id: true, kind: true, filename: true },
    });
    saved.push({ kind, filename: asset.filename, publicPath: assetPublicPath(asset) });
  }

  await db.page.update({ where: { id: page.id }, data: { prompt: buildPrompt(b, saved) } });
  redirect(`/paginas/${page.id}`);
}
