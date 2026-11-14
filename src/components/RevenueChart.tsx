import { pctLabel } from "@/lib/growth";
import { brl } from "@/lib/money";

// Receita por mês, com a variação em relação ao mês anterior (verde quando cresce).
export function RevenueChart({ data }: { data: { label: string; total: number; change: number | null }[] }) {
  const max = Math.max(1, ...data.map((d) => d.total));
  return (
    <div className="flex h-56 items-end gap-3" role="img" aria-label="Receita por mês">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center justify-end gap-1.5">
          {d.change != null && (
            <span className={`text-xs font-bold ${d.change >= 0 ? "text-emerald-400" : "text-red-300"}`}>{pctLabel(d.change)}</span>
          )}
          <span className="text-[11px] text-ink-500">{d.total ? brl(d.total).replace(",00", "") : "—"}</span>
          <div className="w-full rounded-t bg-brand-500" style={{ height: `${Math.max(3, (d.total / max) * 140)}px` }} />
          <span className="text-xs font-semibold uppercase text-ink-500">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
