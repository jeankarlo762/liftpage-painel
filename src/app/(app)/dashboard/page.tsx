import Link from "next/link";
import { Globe, TrendingUp, Wallet } from "lucide-react";
import { RevenueChart } from "@/components/RevenueChart";
import { StatusBadge } from "@/components/StatusBadge";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { brl, toNumber } from "@/lib/money";
import { nicheLabel } from "@/lib/niches";
import { planFeatures } from "@/lib/plans";
import { growthPct, monthlyRevenue, pctLabel } from "@/lib/growth";

export default async function Dashboard() {
  const user = await requireUser();
  const pages = await db.page.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });
  const live = pages.filter((p) => p.status === "LIVE");
  const plan = planFeatures(user.plan);

  const revenue = pages.reduce((s, p) => s + toNumber(p.amountPaid), 0);
  const liveDomains = live.filter((p) => p.domain || p.url || p.hostedByPlatform).length;

  const cutoff = Date.now() - 30 * 86400_000;
  const isRecent = (d: Date) => d.getTime() >= cutoff;
  const revenueRecent = pages.filter((p) => isRecent(p.createdAt)).reduce((s, p) => s + toNumber(p.amountPaid), 0);
  const revenueGrowth = growthPct(revenueRecent, revenue - revenueRecent);
  const liveRecent = live.filter((p) => p.domain || p.url || p.hostedByPlatform).filter((p) => isRecent(p.publishedAt ?? p.createdAt)).length;
  const domainsGrowth = growthPct(liveRecent, liveDomains - liveRecent);
  const months = monthlyRevenue(pages.map((p) => ({ createdAt: p.createdAt, amount: toNumber(p.amountPaid) })));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="h1">Olá, {user.name.split(" ")[0]}</h1>
          <p className="muted">Plano {plan.label} · {plan.maxNiches} nichos liberados</p>
        </div>
        <Link href="/criar" className="btn-primary">Criar nova página</Link>
      </div>


      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="card border-brand-600 bg-brand-700">
          <Wallet className="mb-3 h-5 w-5 text-brand-300" />
          <div className="muted">Receita total</div>
          <div className="flex flex-wrap items-baseline gap-3">
            <div className="font-display text-4xl font-black [font-stretch:125%]">{brl(revenue)}</div>
            <Growth value={revenueGrowth} />
          </div>
          <p className="muted mt-1">Soma do que os clientes pagaram pelas {pages.length} páginas. {brl(revenueRecent)} nos últimos 30 dias.</p>
        </div>
        <div className="card">
          <Globe className="mb-3 h-5 w-5 text-brand-300" />
          <div className="flex flex-wrap items-baseline gap-3">
            <div className="font-display text-4xl font-black [font-stretch:125%]">{liveDomains}</div>
            <Growth value={domainsGrowth} />
          </div>
          <div className="muted">Domínios no ar</div>
          <Link href="/paginas" className="mt-2 inline-block text-sm font-semibold text-brand-300">Ver páginas</Link>
        </div>
      </div>


      <div className="card">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-semibold">Receita por mês</h2>
          <span className="muted">variação em relação ao mês anterior</span>
        </div>
        <RevenueChart data={months} />
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

// Porcentagem de crescimento nos últimos 30 dias, em verde.
function Growth({ value }: { value: number | null }) {
  if (value == null || value === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-sm font-bold text-emerald-400">
      <TrendingUp className="h-3.5 w-3.5" /> {pctLabel(value)} <span className="font-medium text-emerald-400/70">30 dias</span>
    </span>
  );
}
