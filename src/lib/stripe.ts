import "server-only";
import Stripe from "stripe";
import type { Plan } from "@prisma/client";
import { PLANS } from "./plans";

export function stripeEnabled() {
  return !!process.env.STRIPE_SECRET_KEY;
}

let client: Stripe | null = null;
export function stripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY não configurada");
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

// Como cada plano é cobrado no Stripe. Preço em centavos de BRL, montado na hora (sem Price pré-criado).
export function checkoutLineFor(plan: Plan) {
  const p = PLANS[plan];
  if (p.monthlyPrice != null) {
    return {
      mode: "subscription" as const,
      billing: "MONTHLY" as const,
      line: {
        quantity: 1,
        price_data: {
          currency: "brl",
          unit_amount: Math.round(p.monthlyPrice * 100),
          recurring: { interval: "month" as const },
          product_data: { name: `LiftPage ${p.label} (mensal)` },
        },
      },
    };
  }
  if (p.lifetimePrice != null) {
    return {
      mode: "payment" as const,
      billing: "LIFETIME" as const,
      line: {
        quantity: 1,
        price_data: {
          currency: "brl",
          unit_amount: Math.round(p.lifetimePrice * 100),
          product_data: { name: `LiftPage ${p.label} (vitalício)` },
        },
      },
    };
  }
  return null;
}
