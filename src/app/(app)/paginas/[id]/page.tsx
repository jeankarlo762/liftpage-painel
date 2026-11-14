import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, FolderGit2 } from "lucide-react";
import { MiniChart } from "@/components/MiniChart";
import { StatusBadge } from "@/components/StatusBadge";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { nicheLabel } from "@/lib/niches";
import { planFeatures } from "@/lib/plans";
import { TEMPLATE_INFO } from "@/lib/prompt";
import { pageStats } from "@/lib/stats";
import { PublishPanel } from "./PublishPanel";
import { DeleteButton } from "../DeleteButton";
import { hostedUrl } from "@/lib/site";

export default async function PageDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const page = await db.page.findFirst({ where: { id, userId: user.id }, include: { assets: { select: { id: true, kind: true, filename: true } } } });
  if (!page) notFound();
  const plan = planFeatures(user.plan);
  const stats = await pageStats([page.id]);
  const topClicks = await db.pageEvent.groupBy({
    by: ["label"],
    where: { pageId: page.id, type: "click" },
    _count: { _all: true },
    orderBy: { _count: { label: "desc" } },
    take: 5,
  });
  // Publicação sempre nas contas da plataforma.
  const canPublish = page.hostedByPlatform || !!(process.env.PLATFORM_GITHUB_TOKEN && process.env.PLATFORM_RAILWAY_TOKEN);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/paginas" className="muted hover:text-ink-900">← Páginas</Link>
          <h1 className="h1 mt-1 flex items-center gap-3">{page.name} <StatusBadge status={page.status} /></h1>
          <p className="muted">
            {page.clientName ? `${page.clientName} · ` : ""}{nicheLabel(page.niche)} · {page.siteType === "SINGLE" ? "Página única" : "Com sessões"} · {TEMPLATE_INFO[page.template].label}
          </p>
          <p className="muted mt-1">
            {page.hostedByPlatform ? <>Hospedada na LiftPage em <b className="text-ink-900">{hostedUrl(page.slug).replace(/^https?:\/\//, "")}</b></> : "Hospedagem própria (GitHub + Railway)"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DeleteButton pageId={page.id} name={page.name} redirectTo="/paginas" />
          {page.repoUrl && <a className="btn-ghost" href={page.repoUrl} target="_blank"><FolderGit2 className="h-4 w-4" /> Repositório</a>}
          {page.url && <a className="btn-primary" href={page.url} target="_blank"><ExternalLink className="h-4 w-4" /> Ver página</a>}
        </div>
      </div>

      {page.status === "LIVE" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="card lg:col-span-2">
            <div className="mb-4 flex flex-wrap gap-6">
              <Stat label="Visitas (30d)" value={stats.views} />
              <Stat label="Visitantes únicos" value={stats.visitors} />
              <Stat label="Cliques em CTA" value={stats.clicks} />
              <Stat label="Conversão" value={stats.visitors ? `${((stats.clicks / stats.visitors) * 100).toFixed(1)}%` : "—"} />
            </div>
            <MiniChart series={stats.series} />
          </div>
          <div className="card">
            <h2 className="mb-3 font-semibold">CTAs mais clicados</h2>
            {topClicks.length === 0 ? <p className="muted">Sem cliques ainda.</p> : (
              <ul className="space-y-2 text-sm">
                {topClicks.map((c) => (
                  <li key={c.label ?? "-"} className="flex justify-between gap-2"><span className="truncate">{c.label ?? "—"}</span><b>{c._count._all}</b></li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <PublishPanel
        pageId={page.id}
        status={page.status}
        prompt={page.prompt}
        statusLog={page.statusLog}
        error={page.error}
        hasAgent={plan.agent}
        canPublish={canPublish}
        published={!!page.repoUrl}
        assets={page.assets.map((a) => `${a.kind === "logo" ? "Logo" : "Imagem"}: ${a.filename}`)}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="text-2xl font-bold">{typeof value === "number" ? value.toLocaleString("pt-BR") : value}</div>
      <div className="muted">{label}</div>
    </div>
  );
}
