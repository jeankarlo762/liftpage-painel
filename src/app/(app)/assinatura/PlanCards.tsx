import clsx from "clsx";
import { Check } from "lucide-react";
import type { Billing, Plan } from "@prisma/client";
import { PLANS, PLAN_ORDER, formatPrice } from "@/lib/plans";

// Cada plano mostra só as formas de cobrança que oferece (mensal e/ou vitalício).
export function PlanCards(p: { currentPlan: Plan; currentBilling: Billing; email: string; checkout: Record<string, string | null> }) {
  const lifetimeOwned = p.currentBilling === "LIFETIME";
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {PLAN_ORDER.map((key) => {
        const plan = PLANS[key];
        const options = (["MONTHLY", "LIFETIME"] as const).filter((b) => (b === "MONTHLY" ? plan.monthlyPrice : plan.lifetimePrice) != null);
        const isCurrent = key === p.currentPlan;
        // Quem tem vitalício já tem este plano e os de baixo liberados para sempre.
        const included = lifetimeOwned && PLAN_ORDER.indexOf(key) <= PLAN_ORDER.indexOf(p.currentPlan);
        return (
          <div key={key} className={clsx("card flex flex-col", isCurrent && "border-brand-600 ring-2 ring-brand-100")}>
            <div className="mb-3 flex items-center justify-between">
              <h2>{plan.label}</h2>
              {isCurrent && <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">Seu plano</span>}
            </div>
            {options.length === 0 ? (
              <p className="mb-4 text-lg font-semibold">a definir</p>
            ) : (
              <div className="mb-4 space-y-1">
                {options.map((b) => (
                  <p key={b} className="text-lg font-semibold">
                    {formatPrice(b === "MONTHLY" ? plan.monthlyPrice : plan.lifetimePrice, b)}
                    {b === "LIFETIME" && <span className="ml-2 align-middle text-xs font-bold uppercase tracking-wide text-brand-600">vitalício</span>}
                  </p>
                ))}
              </div>
            )}
            <ul className="mb-6 flex-1 space-y-2 text-sm">
              {plan.highlights.map((h) => (
                <li key={h} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-[#1E9C8A]" /> {h}</li>
              ))}
            </ul>
            <div className="space-y-2">
              {included || (isCurrent && options.length <= 1) ? (
                <span className="btn-ghost pointer-events-none w-full">{isCurrent ? "Plano atual" : "Incluído no seu vitalício"}</span>
              ) : options.length === 0 ? (
                <span className="btn-ghost pointer-events-none w-full opacity-60">Em breve</span>
              ) : (
                options
                  .filter((b) => !(isCurrent && b === p.currentBilling))
                  .map((b) => {
                    const url = p.checkout[`${key}_${b}`];
                    const label = b === "LIFETIME" ? `Garantir ${plan.label} vitalício` : `Assinar ${plan.label}`;
                    return url ? (
                      <a key={b} className="btn-primary w-full" href={`${url}${url.includes("?") ? "&" : "?"}prefilled_email=${encodeURIComponent(p.email)}`}>{label}</a>
                    ) : (
                      <span key={b} className="btn-ghost pointer-events-none w-full opacity-60">Checkout em breve</span>
                    );
                  })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
