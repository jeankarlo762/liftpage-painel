import Link from "next/link";
import { Eye, Globe, MousePointerClick, Users, Wallet } from "lucide-react";
import { MiniChart } from "@/components/MiniChart";
import { StatusBadge } from "@/components/StatusBadge";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { brl, toNumber } from "@/lib/money";
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

  const revenue = pages.reduce((s, p) => s + toNumber(p.amountPaid), 0);
  const liveDomains = live.filter((p) => p.domain || p.url).length;

  const cards = [
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
        <div className="card border-amber-500/30 bg-amber-500/10">
          <p className="text-sm text-amber-300">
            Para publicar, conecte seu GitHub e seu Railway em <Link className="font-semibold underline" href="/configuracoes">Configurações</Link>.
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="card border-brand-600 bg-brand-700">
          <Wallet className="mb-3 h-5 w-5 text-brand-300" />
          <div className="muted">Receita total</div>
          <div className="font-display text-4xl font-black [font-stretch:125%]">{brl(revenue)}</div>
          <p className="muted mt-1">Soma do que os clientes pagaram pelas {pages.length} páginas.</p>
        </div>
        <div className="card">
          <Globe className="mb-3 h-5 w-5 text-brand-300" />
          <div className="font-display text-4xl font-black [font-stretch:125%]">{liveDomains}</div>
          <div className="muted">Domínios no ar</div>
          <Link href="/paginas" className="mt-2 inline-block text-sm font-semibold text-brand-300">Ver páginas</Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card">
            <Icon className="mb-3 h-5 w-5 text-brand-300" />
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
          <Link href="/paginas" className="text-sm font-semibold text-brand-300">Ver todas</Link>
        </div>
        {pages.length === 0 ? (
          <p className="muted">Você ainda não criou nenhuma página.</p>
        ) : (
          <ul className="divide-y divide-linha">
            {pages.slice(0, 5).map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3">
                <Link href={`/paginas/${p.id}`} className="font-medium hover:text-brand-300">
                  {p.name} <span className="muted">· {p.domain ?? nicheLabel(p.niche)}</span>
                </Link>
                <span className="flex items-center gap-3">
                  {p.amountPaid != null && <span className="text-sm font-semibold">{brl(toNumber(p.amountPaid))}</span>}
                  <StatusBadge status={p.status} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
