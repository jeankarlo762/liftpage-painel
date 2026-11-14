import clsx from "clsx";
import type { PageStatus } from "@prisma/client";

const MAP: Record<PageStatus, { label: string; cls: string }> = {
  DRAFT: { label: "Rascunho", cls: "bg-slate-100 text-slate-600" },
  GENERATING: { label: "Gerando", cls: "bg-amber-100 text-amber-700" },
  PUSHING: { label: "Criando repositório", cls: "bg-amber-100 text-amber-700" },
  DEPLOYING: { label: "Publicando", cls: "bg-blue-100 text-blue-700" },
  LIVE: { label: "● No ar", cls: "bg-emerald-50 text-[#1E9C8A]" },
  FAILED: { label: "Erro", cls: "bg-red-100 text-red-700" },
};

export function StatusBadge({ status }: { status: PageStatus }) {
  const s = MAP[status];
  return <span className={clsx("rounded-full px-2.5 py-1 text-xs font-semibold", s.cls)}>{s.label}</span>;
}
