import { NextResponse, type NextRequest } from "next/server";
import { currentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe, stripeEnabled } from "@/lib/stripe";

// Portal do Stripe para o cliente trocar cartão ou cancelar a assinatura mensal.
export async function GET(req: NextRequest) {
  const appUrl = process.env.APP_URL ?? req.nextUrl.origin;
  const userId = await currentUserId();
  const sub = userId ? await db.subscription.findUnique({ where: { userId } }) : null;
  if (!stripeEnabled() || !sub?.stripeCustomerId) return NextResponse.redirect(new URL("/assinatura", appUrl));
  const portal = await stripe().billingPortal.sessions.create({ customer: sub.stripeCustomerId, return_url: `${appUrl}/assinatura` });
  return NextResponse.redirect(portal.url, 303);
}
