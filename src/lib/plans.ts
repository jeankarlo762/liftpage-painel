import type { Billing, Plan, Subscription } from "@prisma/client";

export type PlanFeatures = {
  label: string;
  monthlyPrice: number | null;  // R$ por mês
  lifetimePrice: number | null; // R$ pagamento único (vitalício)
  maxNiches: number;         // quantos nichos do catálogo o plano libera
  sections: boolean;         // site com sessões (multi-seção)
  agent: boolean;            // agente Claude gera o código sozinho
  autoHosting: boolean;      // hospedagem automática na conta Railway da plataforma
  prospecting: boolean;      // módulo de prospecção
  highlights: string[];
};

// Regras dos planos em um só lugar. Cobrança: mensal ou vitalício (sem plano anual).
// Preços definidos pelo Grupo MK em 14/11/2026: Pro R$ 49,90 mensal e Premium R$ 149,90 vitalício.
// Basic ainda a definir. null = forma de cobrança não oferecida naquele plano.
export const PLANS: Record<Plan, PlanFeatures> = {
  BASIC: {
    label: "Basic",
    monthlyPrice: null,
    lifetimePrice: null,
    maxNiches: 15,
    sections: false,
    agent: false,
    autoHosting: false,
    prospecting: false,
    highlights: ["15 nichos", "Landing page de página única", "Prompt pronto para colar no Claude", "Publicação no seu GitHub + Railway"],
  },
  PRO: {
    label: "Pro",
    monthlyPrice: 49.9,
    lifetimePrice: null,
    maxNiches: 30,
    sections: true,
    agent: false,
    autoHosting: false,
    prospecting: false,
    highlights: ["30 nichos", "Landing page + sessões", "Prompt pronto para colar no Claude", "Publicação no seu GitHub + Railway"],
  },
  PREMIUM: {
    label: "Premium",
    monthlyPrice: null,
    lifetimePrice: 149.9,
    maxNiches: 50,
    sections: true,
    agent: true,
    autoHosting: true,
    prospecting: true,
    highlights: ["50 nichos", "Landing page + sessões", "Agente Claude cria a página sozinho", "Hospedagem automática", "Prospecção"],
  },
};

export const PLAN_ORDER: Plan[] = ["BASIC", "PRO", "PREMIUM"];

export function planFeatures(plan: Plan | null | undefined): PlanFeatures {
  return PLANS[plan ?? "BASIC"];
}

export const BILLING_LABEL: Record<Billing, string> = { MONTHLY: "Mensal", LIFETIME: "Vitalício" };

export function formatPrice(v: number | null, billing: Billing) {
  if (v == null) return "a definir";
  const n = v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return billing === "MONTHLY" ? `R$ ${n}/mês` : `R$ ${n} pagamento único`;
}

// Acesso liberado? Vitalício ativo nunca expira; mensal vale até o fim do período pago (ou em teste).
export function hasActiveAccess(sub: Pick<Subscription, "status" | "billing" | "currentPeriodEnd"> | null | undefined) {
  if (!sub) return false;
  if (sub.status === "CANCELED") return false;
  if (sub.billing === "LIFETIME") return sub.status === "ACTIVE";
  if (sub.status === "TRIAL" || sub.status === "ACTIVE") return !sub.currentPeriodEnd || sub.currentPeriodEnd > new Date();
  return false; // PAST_DUE
}
