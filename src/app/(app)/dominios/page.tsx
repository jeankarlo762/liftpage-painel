import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type { DnsRecord } from "@/lib/services/railway";
import { AddDomainForm, RefreshButton } from "./DomainForms";

export default async function DominiosPage() {
  const user = await requireUser();
  const [domains, livePages] = await Promise.all([
    db.domain.findMany({ where: { userId: user.id }, include: { page: { select: { name: true } } }, orderBy: { createdAt: "desc" } }),
    db.page.findMany({ where: { userId: user.id, status: "LIVE" }, select: { id: true, name: true } }),
  ]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="h1">Domínios</h1>
        <p className="muted">Ligue seu domínio próprio a uma página publicada. O certificado HTTPS é emitido automaticamente.</p>
      </div>
      <div className="card">
        <AddDomainForm pages={livePages} />
      </div>
      {domains.map((d) => {
        const info = (d.dnsRecords as { records?: DnsRecord[]; verificationToken?: string | null } | null) ?? {};
        return (
          <div key={d.id} className="card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold">{d.hostname}</div>
                <div className="muted">Página: {d.page.name}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${d.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {d.status === "ACTIVE" ? "Ativo" : d.status === "ERROR" ? "Erro" : "Aguardando DNS"}
                </span>
                <RefreshButton id={d.id} />
              </div>
            </div>
            {d.status !== "ACTIVE" && (
              <div className="overflow-x-auto">
                <p className="muted mb-2">Crie estes registros no painel do seu provedor de domínio (Registro.br, GoDaddy, Cloudflare…):</p>
                <table className="w-full text-sm">
                  <thead className="text-left text-ink-500"><tr><th className="py-1 pr-4">Tipo</th><th className="py-1 pr-4">Nome</th><th className="py-1">Valor</th></tr></thead>
                  <tbody className="font-mono text-xs">
                    {(info.records ?? []).map((r, i) => (
                      <tr key={i}><td className="py-1 pr-4">{r.recordType.replace("DNS_RECORD_TYPE_", "")}</td><td className="py-1 pr-4">{r.hostlabel || "@"}</td><td className="break-all py-1">{r.requiredValue}</td></tr>
                    ))}
                    {info.verificationToken && (
                      <tr><td className="py-1 pr-4">TXT</td><td className="py-1 pr-4">verificação</td><td className="break-all py-1">{info.verificationToken}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
