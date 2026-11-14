import Link from "next/link";
import type Stripe from "stripe";
import { currentUserId } from "@/lib/auth";
import { sessionAlreadyUsed, sessionPaid, sessionPlan, sessionRef } from "@/lib/billing";
import { db } from "@/lib/db";
import { PLANS, PLAN_ORDER, formatPrice } from "@/lib/plans";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { CompleteSignup, SignupDone } from "./CompleteSignup";

// O cadastro só existe depois do pagamento: o Stripe volta para cá com ?session_id=...
export default async function CadastroPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  if (!session_id) return <Shell title="Escolha seu plano"><PlanChoice /></Shell>;

  let session: Stripe.Checkout.Session | null = null;
  if (stripeEnabled() && /^cs_[A-Za-z0-9_]+$/.test(session_id)) {
    session = await stripe().checkout.sessions.retrieve(session_id).catch(() => null);
  }
  const plan = session ? sessionPlan(session) : null;
  if (!session || !plan) return <Shell title="Pagamento não encontrado"><p className="muted">Não achamos esse pagamento. Escolha um plano para continuar.</p><PlanChoice /></Shell>;
  if (!sessionPaid(session)) {
    return (
      <Shell title="Aguardando pagamento">
        <p className="muted">Assim que o pagamento for confirmado, atualize esta página para criar seu login.</p>
      </Shell>
    );
  }
  if (await sessionAlreadyUsed(session)) {
    // Quem acabou de criar o login cai aqui já logado: mostra a confirmação e abre o painel.
    const uid = await currentUserId();
    const mine = uid && (await db.subscription.findFirst({ where: { userId: uid, providerRef: sessionRef(session) ?? "" } }));
    if (mine) return <Shell title="Tudo pronto"><SignupDone /></Shell>;
    return (
      <Shell title="Login já criado">
        <p className="muted">Esse pagamento já tem um login. Entre com seu e-mail e senha.</p>
        <Link href="/login" className="btn-primary w-full">Entrar</Link>
      </Shell>
    );
  }
  const email = session.customer_details?.email ?? session.customer_email ?? "";
  return (
    <Shell title="Crie seu login">
      <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
        Pagamento confirmado: plano {PLANS[plan].label}. Agora crie sua senha para acessar o painel.
      </p>
      <CompleteSignup sessionId={session.id} email={email} />
    </Shell>
  );
}

function PlanChoice() {
  return (
    <div className="space-y-3">
      {PLAN_ORDER.map((key) => {
        const p = PLANS[key];
        const billing = p.monthlyPrice != null ? "MONTHLY" : "LIFETIME";
        return (
          <a key={key} href={`/api/checkout/${key.toLowerCase()}`} className="flex items-center justify-between rounded-md border border-linha px-4 py-3 hover:border-brand-300">
            <span className="font-display font-black uppercase [font-stretch:125%]">{p.label}</span>
            <span className="text-sm font-semibold">{formatPrice(billing === "MONTHLY" ? p.monthlyPrice : p.lifetimePrice, billing)}</span>
          </a>
        );
      })}
      <p className="muted text-center">Já tem conta? <Link className="font-semibold text-brand-300" href="/login">Entrar</Link></p>
    </div>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-sm space-y-4">
        <Link href="/" className="mb-2 flex items-center gap-2 font-display font-black uppercase text-ink-900 [font-stretch:125%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-simbolo.svg" alt="" className="h-8 w-8" /> Lift<span className="text-brand-300">Page</span>
        </Link>
        <h1 className="h1">{title}</h1>
        {children}
      </div>
    </main>
  );
}
