import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { applyPaidSession, mapStatus, periodEnd } from "@/lib/billing";
import { db } from "@/lib/db";
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
    case "checkout.session.async_payment_succeeded": {
      // Compra de quem já tem conta (tela Assinatura). Compra pela landing page ainda não tem conta:
      // ela é criada em /cadastro?session_id=..., que confere o pagamento direto no Stripe.
      const session = event.data.object;
      const userId = session.client_reference_id ?? session.metadata?.userId;
      if (userId && (await db.user.findUnique({ where: { id: userId }, select: { id: true } }))) await applyPaidSession(session, userId);
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await onSubscriptionChange(event.data.object);
      break;
  }
  return NextResponse.json({ received: true });
}

async function onSubscriptionChange(sub: Stripe.Subscription) {
  const local = await db.subscription.findFirst({ where: { providerRef: sub.id, billing: "MONTHLY" } });
  if (!local) return; // assinatura antiga, já trocada pelo vitalício, ou conta ainda não criada
  await db.subscription.update({
    where: { id: local.id },
    data: { status: mapStatus(sub.status), currentPeriodEnd: periodEnd(sub) },
  });
}
