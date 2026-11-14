import { NextResponse, type NextRequest } from "next/server";
import type { Plan } from "@prisma/client";
import { currentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLAN_ORDER } from "@/lib/plans";
import { checkoutLineFor, stripe, stripeEnabled } from "@/lib/stripe";

// Link de compra usado na landing page e na tela Assinatura: /api/checkout/pro ou /api/checkout/premium.
// Sem login (cliente vindo da landing page): abre o Stripe direto e, depois de pagar, o cliente cria
// o login em /cadastro?session_id=... Com login: a compra é ligada à conta e liberada pelo webhook.
export async function GET(req: NextRequest, { params }: { params: Promise<{ plan: string }> }) {
  const appUrl = process.env.APP_URL ?? req.nextUrl.origin;
  const plan = (await params).plan.toUpperCase() as Plan;
  const config = PLAN_ORDER.includes(plan) ? checkoutLineFor(plan) : null;
  if (!config) return NextResponse.redirect(new URL("/assinatura?checkout=invalido", appUrl));
  if (!stripeEnabled()) return NextResponse.redirect(new URL("/assinatura?checkout=indisponivel", appUrl));

  const userId = await currentUserId();
  if (!userId) {
    const guest = await stripe().checkout.sessions.create({
      mode: config.mode,
      line_items: [config.line],
      ...(config.mode === "payment" ? { customer_creation: "always" as const } : {}),
      metadata: { plan, billing: config.billing },
      ...(config.mode === "subscription" ? { subscription_data: { metadata: { plan } } } : {}),
      locale: "pt-BR",
      allow_promotion_codes: true,
      success_url: `${appUrl}/cadastro?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/#planos`,
    });
    return NextResponse.redirect(guest.url!, 303);
  }
  const user = await db.user.findUnique({ where: { id: userId }, include: { subscription: true } });
  if (!user) return NextResponse.redirect(new URL("/login", appUrl));

  const sub = user.subscription;
  if (sub?.billing === "LIFETIME" && sub.status === "ACTIVE" && PLAN_ORDER.indexOf(sub.plan) >= PLAN_ORDER.indexOf(plan)) {
    return NextResponse.redirect(new URL("/assinatura?checkout=ja-incluido", appUrl));
  }

  const session = await stripe().checkout.sessions.create({
    mode: config.mode,
    line_items: [config.line],
    client_reference_id: user.id,
    ...(sub?.stripeCustomerId ? { customer: sub.stripeCustomerId } : { customer_email: user.email }),
    ...(config.mode === "payment" ? { customer_creation: "always" as const } : {}),
    metadata: { userId: user.id, plan, billing: config.billing },
    ...(config.mode === "subscription" ? { subscription_data: { metadata: { userId: user.id, plan } } } : {}),
    locale: "pt-BR",
    allow_promotion_codes: true,
    success_url: `${appUrl}/assinatura?checkout=sucesso`,
    cancel_url: `${appUrl}/assinatura?checkout=cancelado`,
  });
  return NextResponse.redirect(session.url!, 303);
}
