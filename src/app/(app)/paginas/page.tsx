import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { brl, toNumber } from "@/lib/money";
import { nicheLabel } from "@/lib/niches";

export default async function PaginasPage() {
  const user = await requireUser();
  const pages = await db.page.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { events: { where: { type: "view" } } } }, domains: { select: { hostname: true } } },
  });
  const total = pages.reduce((s, p) => s + toNumber(p.amountPaid), 0);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="h1">Páginas publicadas <span className="text-brand-300">({pages.length})</span></h1>
          <p className="muted">Cliente, domínio, quanto pagou e as visitas de cada página. Total recebido: <b className="text-ink-900">{brl(total)}</b></p>
        </div>
        <Link href="/criar" className="btn-primary">Criar nova página</Link>
      </div>
      <div className="card overflow-x-auto p-0">
        {pages.length === 0 ? (
          <p className="muted p-6">Nenhuma página ainda.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-linha text-left text-ink-500">
              <tr>
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">Página</th>
                <th className="px-6 py-3 font-medium">Domínio</th>
                <th className="px-6 py-3 text-right font-medium">Valor pago</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 text-right font-medium">Visitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-linha">
              {pages.map((p) => {
                const host = p.domain ?? p.domains[0]?.hostname ?? p.url?.replace(/^https?:\/\//, "") ?? null;
                return (
                  <tr key={p.id} className="hover:bg-white/5">
                    <td className="px-6 py-4 font-semibold">{p.clientName ?? "—"}</td>
                    <td className="px-6 py-4">
                      <Link href={`/paginas/${p.id}`} className="font-semibold hover:text-brand-300">{p.name}</Link>
                      <div className="muted">{nicheLabel(p.niche)}</div>
                    </td>
                    <td className="px-6 py-4">
                      {host ? (
                        <a href={`https://${host}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-300 hover:underline">
                          {host} <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <span className="text-ink-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold">{p.amountPaid != null ? brl(toNumber(p.amountPaid)) : "—"}</td>
                    <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
                    <td className="px-6 py-4 text-right font-semibold">{p._count.events.toLocaleString("pt-BR")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
