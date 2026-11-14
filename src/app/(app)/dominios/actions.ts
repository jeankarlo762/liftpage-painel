"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { railwayTokenFor } from "@/lib/hosting";
import { createCustomDomain, customDomainStatus } from "@/lib/services/railway";

const hostSchema = z
  .string()
  .trim()
  .toLowerCase()
  .transform((s) => s.replace(/^https?:\/\//, "").replace(/\/.*$/, ""))
  .pipe(z.string().regex(/^(?=.{4,253}$)([a-z0-9-]+\.)+[a-z]{2,}$/, "Domínio inválido"));

export async function addDomain(_: unknown, form: FormData): Promise<{ error?: string; ok?: boolean }> {
  const user = await requireUser();
  const host = hostSchema.safeParse(form.get("hostname"));
  if (!host.success) return { error: host.error.issues[0].message };
  const page = await db.page.findFirst({ where: { id: String(form.get("pageId")), userId: user.id } });
  if (!page || page.status !== "LIVE" || !page.railwayProjectId || !page.railwayServiceId || !page.railwayEnvironmentId) {
    return { error: "Escolha uma página que já esteja no ar" };
  }
  if (await db.domain.findUnique({ where: { hostname: host.data } })) return { error: "Esse domínio já está cadastrado" };
  try {
    const token = await railwayTokenFor(page);
    const created = await createCustomDomain(token, {
      domain: host.data,
      projectId: page.railwayProjectId,
      environmentId: page.railwayEnvironmentId,
      serviceId: page.railwayServiceId,
    });
    await db.domain.create({
      data: {
        userId: user.id,
        pageId: page.id,
        hostname: host.data,
        railwayDomainId: created.id,
        dnsRecords: { records: created.status.dnsRecords, verificationToken: created.status.verificationToken ?? null },
      },
    });
  } catch (e) {
    return { error: `Railway: ${(e as Error).message}` };
  }
  revalidatePath("/dominios");
  return { ok: true };
}

export async function refreshDomain(domainId: string) {
  const user = await requireUser();
  const d = await db.domain.findFirst({ where: { id: domainId, userId: user.id }, include: { page: true } });
  if (!d?.railwayDomainId || !d.page.railwayProjectId || !d.page.railwayEnvironmentId || !d.page.railwayServiceId) return;
  const token = await railwayTokenFor(d.page);
  const st = await customDomainStatus(
    token,
    { projectId: d.page.railwayProjectId, environmentId: d.page.railwayEnvironmentId, serviceId: d.page.railwayServiceId },
    d.railwayDomainId,
  );
  if (!st) return;
  const allOk = st.status.dnsRecords.every((r) => /PROPAGATED|VALID/i.test(r.status));
  const prev = (d.dnsRecords as { verificationToken?: string } | null) ?? {};
  await db.domain.update({
    where: { id: d.id },
    data: { status: allOk ? "ACTIVE" : "PENDING_DNS", dnsRecords: { ...prev, records: st.status.dnsRecords } },
  });
  revalidatePath("/dominios");
}
