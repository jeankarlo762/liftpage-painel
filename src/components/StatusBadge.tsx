import clsx from "clsx";
import type { PageStatus } from "@prisma/client";

const MAP: Record<PageStatus, { label: string; cls: string }> = {
  DRAFT: { label: "Rascunho", cls: "bg-white/10 text-ink-500" },
  GENERATING: { label: "Gerando", cls: "bg-amber-500/15 text-amber-300" },
  PUSHING: { label: "Criando repositório", cls: "bg-amber-500/15 text-amber-300" },
  DEPLOYING: { label: "Publicando", cls: "bg-blue-500/15 text-blue-300" },
  LIVE: { label: "● No ar", cls: "bg-emerald-500/10 text-[#1E9C8A]" },
  FAILED: { label: "Erro", cls: "bg-red-500/15 text-red-300" },
};

export function StatusBadge({ status }: { status: PageStatus }) {
  const s = MAP[status];
  return <span className={clsx("rounded-full px-2.5 py-1 text-xs font-semibold", s.cls)}>{s.label}</span>;
}
