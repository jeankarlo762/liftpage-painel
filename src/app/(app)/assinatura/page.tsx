import { requireUser } from "@/lib/auth";
import { BILLING_LABEL, PLANS, hasActiveAccess } from "@/lib/plans";
import { stripeEnabled } from "@/lib/stripe";
import { PlanCards } from "./PlanCards";

const STATUS = { TRIAL: "Período de teste", ACTIVE: "Ativa", PAST_DUE: "Pagamento pendente", CANCELED: "Cancelada" } as const;

const NOTICE: Record<string, { tone: "ok" | "warn"; text: string }> = {
  sucesso: { tone: "ok", text: "Pagamento recebido! Seu plano é liberado em instantes (atualize a página se ainda não aparecer)." },
  cancelado: { tone: "warn", text: "Compra cancelada. Nada foi cobrado." },
  indisponivel: { tone: "warn", text: "O checkout ainda está sendo configurado. Tente de novo em breve." },
  "ja-incluido": { tone: "ok", text: "Esse plano já está incluído no seu acesso vitalício." },
  invalido: { tone: "warn", text: "Plano não encontrado." },
};

export default async function AssinaturaPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const user = await requireUser();
  const { checkout } = await searchParams;
  const sub = user.subscription;
  const lifetime = sub?.billing === "LIFETIME";
  const active = hasActiveAccess(sub);
  const notice = checkout ? NOTICE[checkout] : undefined;

  return (
    <div className="space-y-6">
      <h1 className="h1">Assinatura</h1>
      {notice && (
        <p className={`rounded-md px-4 py-3 text-sm ${notice.tone === "ok" ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}`}>{notice.text}</p>
      )}
      {!active && !notice && (
        <p className="rounded-md bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          {sub ? "Seu acesso não está ativo." : "Você ainda não tem um plano."} Escolha um plano abaixo para criar e publicar páginas.
        </p>
      )}
      {sub && (
        <div className="card grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Info label="Plano atual" value={PLANS[sub.plan].label} />
          <Info label="Cobrança" value={BILLING_LABEL[sub.billing]} />
          <Info label="Status" value={lifetime && sub.status === "ACTIVE" ? "Acesso vitalício" : STATUS[sub.status]} />
          <Info
            label="Próxima cobrança"
            value={lifetime ? "Sem cobranças futuras" : sub.currentPeriodEnd ? sub.currentPeriodEnd.toLocaleDateString("pt-BR") : "—"}
          />
          <div>
            <div className="muted">Forma de pagamento</div>
            <div className="font-semibold">{sub.paymentMethod ?? "—"}</div>
            {!lifetime && sub.stripeCustomerId && (
              <a href="/api/billing-portal" className="text-sm font-semibold text-brand-300 hover:underline">Gerenciar ou cancelar</a>
            )}
          </div>
        </div>
      )}
      <PlanCards currentPlan={sub ? user.plan : null} currentBilling={sub?.billing ?? null} active={active} checkoutReady={stripeEnabled()} />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="muted">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
