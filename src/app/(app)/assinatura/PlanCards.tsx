"use client";

import { useState } from "react";
import clsx from "clsx";
import { Check } from "lucide-react";
import type { Billing, Plan } from "@prisma/client";
import { PLANS, PLAN_ORDER, formatPrice } from "@/lib/plans";

export function PlanCards(p: { currentPlan: Plan; currentBilling: Billing; email: string; checkout: Record<string, string | null> }) {
  const [billing, setBilling] = useState<Billing>(p.currentBilling === "LIFETIME" ? "LIFETIME" : "MONTHLY");
  const lifetimeOwned = p.currentBilling === "LIFETIME";

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-md border border-linha bg-white p-1" role="group" aria-label="Forma de cobrança">
        {(["MONTHLY", "LIFETIME"] as const).map((b) => (
          <button
            key={b}
            type="button"
            aria-pressed={billing === b}
            onClick={() => setBilling(b)}
            className={clsx(
              "rounded-[3px] px-4 py-2 text-xs font-bold uppercase tracking-[0.06em]",
              billing === b ? "bg-brand-600 text-white" : "text-ink-500 hover:text-ink-900",
            )}
          >
            {b === "MONTHLY" ? "Mensal" : "Vitalício"}
          </button>
        ))}
      </div>
      <p className="muted">
        {billing === "MONTHLY" ? "Cobrança todo mês, cancele quando quiser." : "Pagamento único: o plano fica liberado para sempre, sem mensalidade."}
      </p>

      <div className="grid gap-4 lg:grid-cols-3">
        {PLAN_ORDER.map((key) => {
          const plan = PLANS[key];
          const price = billing === "MONTHLY" ? plan.monthlyPrice : plan.lifetimePrice;
          const current = key === p.currentPlan && billing === p.currentBilling;
          // Quem tem vitalício já tem este plano e os de baixo liberados para sempre.
          const blocked = lifetimeOwned && PLAN_ORDER.indexOf(key) <= PLAN_ORDER.indexOf(p.currentPlan);
          const url = p.checkout[`${key}_${billing}`];
          return (
            <div key={key} className={clsx("card flex flex-col", current && "border-brand-600 ring-2 ring-brand-100")}>
              <div className="mb-1 flex items-center justify-between">
                <h2>{plan.label}</h2>
                {current && <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">Seu plano</span>}
              </div>
              <p className="mb-4 text-lg font-semibold">{formatPrice(price, billing)}</p>
              <ul className="mb-6 flex-1 space-y-2 text-sm">
                {plan.highlights.map((h) => (
                  <li key={h} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-[#1E9C8A]" /> {h}</li>
                ))}
              </ul>
              {current ? (
                <span className="btn-ghost pointer-events-none">Plano atual</span>
              ) : blocked ? (
                <span className="btn-ghost pointer-events-none opacity-60">Incluído no seu vitalício</span>
              ) : url && price != null ? (
                <a className="btn-primary" href={`${url}${url.includes("?") ? "&" : "?"}email=${encodeURIComponent(p.email)}`}>
                  {billing === "LIFETIME" ? `Garantir ${plan.label} vitalício` : `Assinar ${plan.label}`}
                </a>
              ) : (
                <span className="btn-ghost pointer-events-none opacity-60">Checkout em breve</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
