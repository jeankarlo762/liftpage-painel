"use client";

import { useActionState } from "react";
import { changePassword, updateProfile } from "./actions";

type U = { name: string; email: string; phone: string | null; company: string | null; document: string | null };

export function ProfileForm({ user }: { user: U }) {
  const [state, action, pending] = useActionState(updateProfile, undefined);
  return (
    <form action={action} className="card grid gap-4 sm:grid-cols-2">
      <h2 className="font-semibold sm:col-span-2">Dados de cadastro</h2>
      <F name="name" label="Nome" value={user.name} />
      <F name="email" label="E-mail" value={user.email} type="email" />
      <F name="phone" label="Telefone" value={user.phone} />
      <F name="company" label="Empresa" value={user.company} />
      <F name="document" label="CPF/CNPJ" value={user.document} />
      <div className="flex items-center gap-3 sm:col-span-2">
        <button className="btn-primary" disabled={pending}>Salvar</button>
        {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
        {state?.ok && <span className="text-sm text-emerald-700">{state.ok}</span>}
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);
  return (
    <form action={action} className="card grid gap-4 sm:grid-cols-2">
      <h2 className="font-semibold sm:col-span-2">Alterar senha</h2>
      <F name="current" label="Senha atual" type="password" />
      <F name="next" label="Nova senha" type="password" />
      <div className="flex items-center gap-3 sm:col-span-2">
        <button className="btn-ghost" disabled={pending}>Alterar senha</button>
        {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
        {state?.ok && <span className="text-sm text-emerald-700">{state.ok}</span>}
      </div>
    </form>
  );
}

function F({ name, label, value, type = "text" }: { name: string; label: string; value?: string | null; type?: string }) {
  return (
    <label>
      <span className="label">{label}</span>
      <input className="input" name={name} type={type} defaultValue={value ?? ""} />
    </label>
  );
}
