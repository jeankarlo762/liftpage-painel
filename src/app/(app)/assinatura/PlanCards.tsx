import clsx from "clsx";
import { Check } from "lucide-react";
import type { Billing, Plan } from "@prisma/client";
import { PLANS, PLAN_ORDER, formatPrice } from "@/lib/plans";

// Pro é mensal e Premium é vitalício. O botão leva para /api/checkout/<plano>, que abre o Stripe.
export function PlanCards(p: { currentPlan: Plan | null; currentBilling: Billing | null; active: boolean; checkoutReady: boolean }) {
  const lifetimeOwned = p.active && p.currentBilling === "LIFETIME";
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {PLAN_ORDER.map((key) => {
        const plan = PLANS[key];
        const billing: Billing = plan.monthlyPrice != null ? "MONTHLY" : "LIFETIME";
        const price = billing === "MONTHLY" ? plan.monthlyPrice : plan.lifetimePrice;
        const isCurrent = p.active && key === p.currentPlan;
        const included = lifetimeOwned && p.currentPlan != null && PLAN_ORDER.indexOf(key) <= PLAN_ORDER.indexOf(p.currentPlan);
        return (
          <div key={key} className={clsx("card flex flex-col", isCurrent && "border-brand-600 ring-2 ring-brand-100")}>
            <div className="mb-3 flex items-center justify-between">
              <h2>{plan.label}</h2>
              {isCurrent ? (
                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">Seu plano</span>
              ) : billing === "LIFETIME" ? (
                <span className="rounded-full bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white">Vitalício</span>
              ) : null}
            </div>
            <p className="mb-1 text-2xl font-bold">{formatPrice(price, billing)}</p>
            <p className="muted mb-4">{billing === "MONTHLY" ? "Cobrança mensal, cancele quando quiser." : "Pague uma vez e use para sempre."}</p>
            <ul className="mb-6 flex-1 space-y-2 text-sm">
              {plan.highlights.map((h) => (
                <li key={h} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-[#1E9C8A]" /> {h}</li>
              ))}
            </ul>
            {isCurrent || included ? (
              <span className="btn-ghost pointer-events-none w-full">{isCurrent ? "Plano atual" : "Incluído no seu vitalício"}</span>
            ) : p.checkoutReady ? (
              <a className="btn-primary w-full" href={`/api/checkout/${key.toLowerCase()}`}>
                {billing === "LIFETIME" ? `Garantir ${plan.label} vitalício` : `Assinar ${plan.label}`}
              </a>
            ) : (
              <span className="btn-ghost pointer-events-none w-full opacity-60">Checkout em breve</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
