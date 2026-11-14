// Gráfico de barras simples (sem dependências) das visitas por dia.
export function MiniChart({ series }: { series: { day: string; views: number }[] }) {
  const max = Math.max(1, ...series.map((s) => s.views));
  return (
    <div className="flex h-32 items-end gap-1" role="img" aria-label="Visitas por dia">
      {series.map((s) => (
        <div key={s.day} className="group relative flex-1">
          <div className="rounded-t bg-brand-600/85 group-hover:bg-brand-600" style={{ height: `${Math.max(2, (s.views / max) * 128)}px` }} />
          <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink-900 px-1.5 py-0.5 text-[11px] text-white group-hover:block">
            {s.day.slice(8, 10)}/{s.day.slice(5, 7)}: {s.views}
          </span>
        </div>
      ))}
    </div>
  );
}
