"use client";

import { useActionState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { addDomain, refreshDomain } from "./actions";

export function AddDomainForm({ pages }: { pages: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(addDomain, undefined);
  if (pages.length === 0) return <p className="muted">Publique uma página primeiro para conectar um domínio.</p>;
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <label>
        <span className="label">Domínio</span>
        <input className="input" name="hostname" placeholder="www.seunegocio.com.br" required />
      </label>
      <label>
        <span className="label">Página</span>
        <select className="input" name="pageId">
          {pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>
      <button className="btn-primary" disabled={pending}>{pending ? "Cadastrando…" : "Adicionar domínio"}</button>
      {state?.error && <p className="text-sm text-red-600 sm:col-span-3">{state.error}</p>}
    </form>
  );
}

export function RefreshButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button className="btn-ghost px-3 py-1.5" disabled={pending} onClick={() => start(() => refreshDomain(id))} aria-label="Verificar DNS">
      <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} /> Verificar
    </button>
  );
}
