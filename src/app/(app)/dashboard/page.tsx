import Link from "next/link";
import { Eye, MousePointerClick, Rocket, Users } from "lucide-react";
import { MiniChart } from "@/components/MiniChart";
import { StatusBadge } from "@/components/StatusBadge";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { nicheLabel } from "@/lib/niches";
import { planFeatures } from "@/lib/plans";
import { pageStats } from "@/lib/stats";

export default async function Dashboard() {
  const user = await requireUser();
  const pages = await db.page.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });
  const live = pages.filter((p) => p.status === "LIVE");
  const stats = await pageStats(live.map((p) => p.id));
  const plan = planFeatures(user.plan);
  const connected = new Set(user.connections.map((c) => c.provider));
  const needsConnections = !plan.autoHosting && (!connected.has("github") || !connected.has("railway"));

  const cards = [
    { label: "Páginas no ar", value: live.length, icon: Rocket },
    { label: "Visitas (30 dias)", value: stats.views, icon: Eye },
    { label: "Visitantes únicos", value: stats.visitors, icon: Users },
    { label: "Cliques em CTA", value: stats.clicks, icon: MousePointerClick },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="h1">Olá, {user.name.split(" ")[0]}</h1>
          <p className="muted">Plano {plan.label} · {plan.maxNiches} nichos liberados</p>
        </div>
        <Link href="/criar" className="btn-primary">Criar nova página</Link>
      </div>

      {needsConnections && (
        <div className="card border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-800">
            Para publicar, conecte seu GitHub e seu Railway em <Link className="font-semibold underline" href="/configuracoes">Configurações</Link>.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card">
            <Icon className="mb-3 h-5 w-5 text-brand-600" />
            <div className="text-2xl font-bold">{value.toLocaleString("pt-BR")}</div>
            <div className="muted">{label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="mb-4 font-semibold">Visitas nos últimos 30 dias</h2>
        <MiniChart series={stats.series} />
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Páginas recentes</h2>
          <Link href="/paginas" className="text-sm font-semibold text-brand-600">Ver todas</Link>
        </div>
        {pages.length === 0 ? (
          <p className="muted">Você ainda não criou nenhuma página.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {pages.slice(0, 5).map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3">
                <Link href={`/paginas/${p.id}`} className="font-medium hover:text-brand-600">
                  {p.name} <span className="muted">· {nicheLabel(p.niche)}</span>
                </Link>
                <StatusBadge status={p.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
