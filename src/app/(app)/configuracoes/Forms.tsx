"use client";

import { useActionState, useTransition } from "react";
import { connectGithubToken, connectRailway, disconnect } from "./actions";

export function TokenForm({ provider, placeholder }: { provider: "github" | "railway"; placeholder: string }) {
  const [state, action, pending] = useActionState(provider === "github" ? connectGithubToken : connectRailway, undefined);
  return (
    <form action={action} className="space-y-2">
      <div className="flex gap-2">
        <input className="input" name="token" type="password" placeholder={placeholder} autoComplete="off" />
        <button className="btn-ghost shrink-0" disabled={pending}>{pending ? "Validando…" : "Salvar"}</button>
      </div>
      {state?.error && <p className="text-sm text-red-300">{state.error}</p>}
      {state?.ok && <p className="text-sm text-emerald-300">{state.ok}</p>}
    </form>
  );
}

export function DisconnectButton({ provider }: { provider: string }) {
  const [pending, start] = useTransition();
  return (
    <button className="text-sm font-medium text-red-300 hover:underline" disabled={pending} onClick={() => start(() => disconnect(provider))}>
      Desconectar
    </button>
  );
}
