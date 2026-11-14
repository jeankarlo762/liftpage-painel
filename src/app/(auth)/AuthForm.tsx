"use client";

import Link from "next/link";
import { useActionState } from "react";
import { BRAND } from "@/lib/brand";
import { login, signup } from "./actions";

export function AuthForm({ mode, next }: { mode: "login" | "signup"; next?: string }) {
  const [state, action, pending] = useActionState(mode === "login" ? login : signup, undefined);
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form action={action} className="card w-full max-w-sm space-y-4">
        {next && <input type="hidden" name="next" value={next} />}
        <div>
          <div className="mb-6 flex items-center gap-2 font-display font-black uppercase text-ink-900 [font-stretch:125%]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-simbolo.svg" alt="" className="h-8 w-8" /> Lift<span className="text-brand-300">Page</span>
          </div>
          <h1 className="h1">{mode === "login" ? "Entrar" : "Criar conta"}</h1>
          <p className="muted mt-1">{BRAND.tagline}</p>
        </div>
        {mode === "signup" && (
          <div>
            <label className="label" htmlFor="name">Nome</label>
            <input className="input" id="name" name="name" required />
          </div>
        )}
        <div>
          <label className="label" htmlFor="email">E-mail</label>
          <input className="input" id="email" name="email" type="email" required />
        </div>
        <div>
          <label className="label" htmlFor="password">Senha</label>
          <input className="input" id="password" name="password" type="password" required minLength={mode === "signup" ? 8 : undefined} />
        </div>
        {state?.error && <p className="text-sm text-red-300">{state.error}</p>}
        <button className="btn-primary w-full" disabled={pending}>{pending ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}</button>
        <p className="muted text-center">
          {mode === "login" ? (
            <>Não tem conta? <Link className="font-semibold text-brand-300" href={next ? `/cadastro?next=${encodeURIComponent(next)}` : "/cadastro"}>Cadastre-se</Link></>
          ) : (
            <>Já tem conta? <Link className="font-semibold text-brand-300" href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}>Entrar</Link></>
          )}
        </p>
      </form>
    </main>
  );
}
