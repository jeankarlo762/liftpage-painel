import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import type { Plan, SubscriptionStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { PLAN_ORDER } from "@/lib/plans";
import { stripe } from "@/lib/stripe";

// Webhook do Stripe. Eventos a assinar no painel do Stripe:
// checkout.session.completed, checkout.session.async_payment_succeeded,
// customer.subscription.updated, customer.subscription.deleted.
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) return NextResponse.json({ error: "assinatura ausente" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await req.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "assinatura inválida" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await onCheckoutPaid(event.data.object);
      break;
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await onSubscriptionChange(event.data.object);
      break;
  }
  return NextResponse.json({ received: true });
}

function periodEnd(sub: Stripe.Subscription) {
  // Nas versões novas da API o fim do período fica no item da assinatura.
  const item = sub.items?.data?.[0] as (Stripe.SubscriptionItem & { current_period_end?: number }) | undefined;
  const legacy = (sub as Stripe.Subscription & { current_period_end?: number }).current_period_end;
  const ts = item?.current_period_end ?? legacy;
  return ts ? new Date(ts * 1000) : null;
}

function mapStatus(s: Stripe.Subscription.Status): SubscriptionStatus {
  if (s === "active" || s === "trialing") return "ACTIVE";
  if (s === "past_due" || s === "unpaid" || s === "incomplete") return "PAST_DUE";
  return "CANCELED";
}

async function onCheckoutPaid(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") return; // boleto ainda pendente
  const userId = session.client_reference_id ?? session.metadata?.userId;
  const plan = session.metadata?.plan as Plan | undefined;
  if (!userId || !plan || !PLAN_ORDER.includes(plan)) return;
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
    return;
  }

  // Pagamento único: acesso vitalício.
  const paymentRef = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? session.id;
  const data = {
    plan,
    billing: "LIFETIME" as const,
    status: "ACTIVE" as const,
    currentPeriodEnd: null,
    provider: "stripe",
    providerRef: paymentRef,
    stripeCustomerId: customerId ?? previous?.stripeCustomerId ?? null,
    paymentMethod: "Pagamento único (Stripe)",
  };
  await db.subscription.upsert({ where: { userId }, create: { userId, ...data }, update: data });

  // Quem tinha o mensal e comprou o vitalício não deve continuar sendo cobrado.
  if (previous?.billing === "MONTHLY" && previous.providerRef?.startsWith("sub_")) {
    await stripe().subscriptions.cancel(previous.providerRef).catch(() => {});
  }
}

async function onSubscriptionChange(sub: Stripe.Subscription) {
  const local = await db.subscription.findFirst({ where: { providerRef: sub.id, billing: "MONTHLY" } });
  if (!local) return; // assinatura antiga ou já trocada pelo vitalício
  await db.subscription.update({
    where: { id: local.id },
    data: { status: mapStatus(sub.status), currentPeriodEnd: periodEnd(sub) },
  });
}
