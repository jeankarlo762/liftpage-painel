import { requireUser } from "@/lib/auth";
import { BILLING_LABEL, PLANS, PLAN_ORDER, hasActiveAccess } from "@/lib/plans";
import { PlanCards } from "./PlanCards";

const STATUS = { TRIAL: "Período de teste", ACTIVE: "Ativa", PAST_DUE: "Pagamento pendente", CANCELED: "Cancelada" } as const;

export default async function AssinaturaPage() {
  const user = await requireUser();
  const sub = user.subscription;
  const lifetime = sub?.billing === "LIFETIME";
  const active = hasActiveAccess(sub);

  // Links de checkout por plano e forma de cobrança: CHECKOUT_URL_<PLANO>_<MONTHLY|LIFETIME>.
  const checkout = Object.fromEntries(
    PLAN_ORDER.flatMap((p) =>
      (["MONTHLY", "LIFETIME"] as const).map((b) => [`${p}_${b}`, process.env[`CHECKOUT_URL_${p}_${b}`] ?? null]),
    ),
  );

  return (
    <div className="space-y-6">
      <h1 className="h1">Assinatura</h1>
      {!active && (
        <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Seu acesso não está ativo. Escolha um plano abaixo para continuar criando e publicando páginas.
        </p>
      )}
      <div className="card grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Info label="Plano atual" value={PLANS[user.plan].label} />
        <Info label="Cobrança" value={sub ? BILLING_LABEL[sub.billing] : "—"} />
        <Info label="Status" value={sub ? (lifetime && sub.status === "ACTIVE" ? "Acesso vitalício" : STATUS[sub.status]) : "—"} />
        {lifetime ? (
          <Info label="Próxima cobrança" value="Sem cobranças futuras" />
        ) : (
          <Info label="Próxima cobrança" value={sub?.currentPeriodEnd ? sub.currentPeriodEnd.toLocaleDateString("pt-BR") : "—"} />
        )}
        <Info label="Forma de pagamento" value={sub?.paymentMethod ?? "Não cadastrada"} />
      </div>

      <PlanCards
        currentPlan={user.plan}
        currentBilling={sub?.billing ?? "MONTHLY"}
        email={user.email}
        checkout={checkout}
      />
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
