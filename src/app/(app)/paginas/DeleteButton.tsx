"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deletePage } from "./actions";

// Exclusão em dois cliques: o primeiro pede confirmação.
export function DeleteButton({ pageId, name, redirectTo }: { pageId: string; name: string; redirectTo?: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  if (!confirming) {
    return (
      <button type="button" aria-label={`Excluir ${name}`} title="Excluir página" className="text-ink-500 hover:text-red-300" onClick={() => setConfirming(true)}>
        <Trash2 className="h-4 w-4" />
      </button>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center justify-end gap-2 text-xs">
      <span className="text-red-300">{error ?? "Excluir e tirar do ar?"}</span>
      <button
        type="button"
        disabled={pending}
        className="rounded-[3px] bg-red-600 px-2 py-1 font-bold uppercase text-white hover:bg-red-500"
        onClick={() =>
          start(async () => {
            const res = await deletePage(pageId);
            if (res.error) return setError(res.error);
            if (redirectTo) router.push(redirectTo);
            else router.refresh();
          })
        }
      >
        {pending ? "Excluindo…" : "Excluir"}
      </button>
      <button type="button" className="font-semibold text-ink-500 hover:text-ink-900" onClick={() => { setConfirming(false); setError(null); }}>
        Cancelar
      </button>
    </span>
  );
}
