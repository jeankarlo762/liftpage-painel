import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { nicheLabel } from "@/lib/niches";

export default async function PaginasPage() {
  const user = await requireUser();
  const pages = await db.page.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { events: { where: { type: "view" } } } }, domains: { select: { hostname: true } } },
  });
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="h1">Páginas publicadas</h1>
          <p className="muted">Acompanhe o status e as estatísticas de cada página.</p>
        </div>
        <Link href="/criar" className="btn-primary">Criar nova página</Link>
      </div>
      <div className="card overflow-x-auto p-0">
        {pages.length === 0 ? (
          <p className="muted p-6">Nenhuma página ainda.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 text-left text-ink-500">
              <tr>
                <th className="px-6 py-3 font-medium">Página</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Endereço</th>
                <th className="px-6 py-3 text-right font-medium">Visitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pages.map((p) => {
                const host = p.domains[0]?.hostname ? `https://${p.domains[0].hostname}` : p.url;
                return (
                  <tr key={p.id} className="hover:bg-gelo">
                    <td className="px-6 py-4">
                      <Link href={`/paginas/${p.id}`} className="font-semibold hover:text-brand-600">{p.name}</Link>
                      <div className="muted">{nicheLabel(p.niche)}</div>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
                    <td className="px-6 py-4">
                      {host ? (
                        <a href={host} target="_blank" className="inline-flex items-center gap-1 text-brand-600 hover:underline">
                          {host.replace("https://", "")} <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <span className="text-ink-300">—</span>
                      )}
                    </td>
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
