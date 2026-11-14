import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

// Webhook genérico do checkout. O gateway escolhido (Asaas, Stripe, Mercado Pago…) chama esta rota,
// ou um adaptador traduz o evento dele para este formato.
const schema = z.object({
  email: z.string().email(),
  plan: z.enum(["BASIC", "PRO", "PREMIUM"]),
  status: z.enum(["TRIAL", "ACTIVE", "PAST_DUE", "CANCELED"]),
  billing: z.enum(["MONTHLY", "LIFETIME"]).default("MONTHLY"), // vitalício = pagamento único, sem currentPeriodEnd
  currentPeriodEnd: z.string().datetime().optional(),
  provider: z.string().optional(),
  providerRef: z.string().optional(),
  paymentMethod: z.string().optional(),
});

function authorized(req: NextRequest) {
  const expected = process.env.PAYMENT_WEBHOOK_SECRET;
  const got = req.headers.get("x-webhook-secret") ?? "";
  if (!expected || got.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: p.error.issues[0].message }, { status: 400 });
  const user = await db.user.findUnique({ where: { email: p.data.email.toLowerCase() } });
  if (!user) return NextResponse.json({ error: "usuário não encontrado" }, { status: 404 });
  const { email: _email, currentPeriodEnd, ...rest } = p.data;
  const data = {
    ...rest,
    currentPeriodEnd: rest.billing === "LIFETIME" ? null : currentPeriodEnd ? new Date(currentPeriodEnd) : undefined,
  };
  await db.subscription.upsert({ where: { userId: user.id }, create: { userId: user.id, ...data }, update: data });
  return NextResponse.json({ ok: true });
}
