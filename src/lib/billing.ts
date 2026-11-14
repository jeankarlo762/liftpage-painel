import "server-only";
import type Stripe from "stripe";
import type { Plan, SubscriptionStatus } from "@prisma/client";
import { db } from "./db";
import { PLAN_ORDER } from "./plans";
import { stripe } from "./stripe";

export function sessionPaid(s: Stripe.Checkout.Session) {
  return s.status === "complete" && (s.payment_status === "paid" || s.payment_status === "no_payment_required");
}

export function sessionPlan(s: Stripe.Checkout.Session): Plan | null {
  const plan = s.metadata?.plan as Plan | undefined;
  return plan && PLAN_ORDER.includes(plan) ? plan : null;
}

// Referência do pagamento que fica em Subscription.providerRef: id da assinatura (mensal) ou do pagamento (vitalício).
export function sessionRef(s: Stripe.Checkout.Session) {
  if (s.mode === "subscription") return typeof s.subscription === "string" ? s.subscription : s.subscription?.id ?? null;
  return typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id ?? s.id;
}

// Um pagamento só libera uma conta.
export async function sessionAlreadyUsed(s: Stripe.Checkout.Session) {
  const ref = sessionRef(s);
  return !!ref && !!(await db.subscription.findFirst({ where: { providerRef: ref } }));
}

export function periodEnd(sub: Stripe.Subscription) {
  // Nas versões novas da API o fim do período fica no item da assinatura.
  const item = sub.items?.data?.[0] as (Stripe.SubscriptionItem & { current_period_end?: number }) | undefined;
  const legacy = (sub as Stripe.Subscription & { current_period_end?: number }).current_period_end;
  const ts = item?.current_period_end ?? legacy;
  return ts ? new Date(ts * 1000) : null;
}

export function mapStatus(s: Stripe.Subscription.Status): SubscriptionStatus {
  if (s === "active" || s === "trialing") return "ACTIVE";
  if (s === "past_due" || s === "unpaid" || s === "incomplete") return "PAST_DUE";
  return "CANCELED";
}

// Libera o plano comprado nesta sessão de checkout para o usuário.
export async function applyPaidSession(session: Stripe.Checkout.Session, userId: string) {
  const plan = sessionPlan(session);
  if (!plan || !sessionPaid(session)) return false;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
  const previous = await db.subscription.findUnique({ where: { userId } });

  if (session.mode === "subscription" && session.subscription) {
    const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
    const sub = await stripe().subscriptions.retrieve(subId);
    const data = {
      plan,
      billing: "MONTHLY" as const,
      status: mapStatus(sub.status),
      currentPeriodEnd: periodEnd(sub),
      provider: "stripe",
      providerRef: sub.id,
      stripeCustomerId: customerId,
      paymentMethod: "Cartão (Stripe)",
    };
    await db.subscription.upsert({ where: { userId }, create: { userId, ...data }, update: data });
    return true;
  }

  const data = {
    plan,
    billing: "LIFETIME" as const,
    status: "ACTIVE" as const,
    currentPeriodEnd: null,
    provider: "stripe",
    providerRef: sessionRef(session),
    stripeCustomerId: customerId ?? previous?.stripeCustomerId ?? null,
    paymentMethod: "Pagamento único (Stripe)",
  };
  await db.subscription.upsert({ where: { userId }, create: { userId, ...data }, update: data });

  // Quem tinha o mensal e comprou o vitalício não deve continuar sendo cobrado.
  if (previous?.billing === "MONTHLY" && previous.providerRef?.startsWith("sub_")) {
    await stripe().subscriptions.cancel(previous.providerRef).catch(() => {});
  }
  return true;
}
