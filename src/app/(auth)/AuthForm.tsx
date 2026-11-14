"use client";

import Link from "next/link";
import { useActionState } from "react";
import { BRAND } from "@/lib/brand";
import { login } from "./actions";

// Só login: a conta é criada depois do pagamento, em /cadastro?session_id=...
export function AuthForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form action={action} className="card w-full max-w-sm space-y-4">
        {next && <input type="hidden" name="next" value={next} />}
        <div>
          <div className="mb-6 flex items-center gap-2 font-display font-black uppercase text-ink-900 [font-stretch:125%]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-simbolo.svg" alt="" className="h-8 w-8" /> Lift<span className="text-brand-300">Page</span>
          </div>
          <h1 className="h1">Entrar</h1>
          <p className="muted mt-1">{BRAND.tagline}</p>
        </div>
        <div>
          <label className="label" htmlFor="email">E-mail</label>
          <input className="input" id="email" name="email" type="email" required />
        </div>
        <div>
          <label className="label" htmlFor="password">Senha</label>
          <input className="input" id="password" name="password" type="password" required />
        </div>
        {state?.error && <p className="text-sm text-red-300">{state.error}</p>}
        <button className="btn-primary w-full" disabled={pending}>{pending ? "Aguarde…" : "Entrar"}</button>
        <p className="muted text-center">
          Não tem conta? <Link className="font-semibold text-brand-300" href="/#planos">Escolha um plano</Link>
        </p>
      </form>
    </main>
  );
}
