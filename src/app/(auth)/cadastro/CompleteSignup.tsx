"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { completeSignup } from "../actions";

export function CompleteSignup({ sessionId, email }: { sessionId: string; email: string }) {
  const [state, action, pending] = useActionState(completeSignup, undefined);
  if (state?.ok) return <SignupDone />;
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="session_id" value={sessionId} />
      <div>
        <label className="label" htmlFor="email">E-mail</label>
        <input className="input" id="email" name="email" type="email" defaultValue={email} readOnly={!!email} required />
      </div>
      <div>
        <label className="label" htmlFor="password">Senha</label>
        <input className="input" id="password" name="password" type="password" minLength={8} required />
      </div>
      <div>
        <label className="label" htmlFor="confirm">Confirmar senha</label>
        <input className="input" id="confirm" name="confirm" type="password" minLength={8} required />
      </div>
      {state?.error && <p className="text-sm text-red-300">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Criando…" : "Criar login"}</button>
    </form>
  );
}

export function SignupDone() {
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(() => router.replace("/dashboard"), 1800);
    return () => clearTimeout(t);
  }, [router]);
  return (
    <div className="space-y-3 text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-300" />
      <p className="text-lg font-semibold">Login criado com sucesso!</p>
      <p className="muted">Abrindo seu painel…</p>
      <a href="/dashboard" className="btn-primary w-full">Abrir o painel</a>
    </div>
  );
}
