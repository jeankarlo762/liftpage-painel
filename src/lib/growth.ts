// Crescimento: compara o que entrou nos últimos 30 dias com o acumulado até 30 dias atrás.
export function growthPct(recent: number, before: number) {
  if (before <= 0) return recent > 0 ? null : 0; // sem base de comparação
  return (recent / before) * 100;
}

// Receita por mês (últimos N meses) a partir da data de criação de cada página.
export function monthlyRevenue(items: { createdAt: Date; amount: number }[], months = 6) {
  const now = new Date();
  const buckets = Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""), total: 0 };
  });
  for (const it of items) {
    const b = buckets.find((x) => x.key === `${it.createdAt.getFullYear()}-${it.createdAt.getMonth()}`);
    if (b) b.total += it.amount;
  }
  return buckets.map((b, i) => {
    const prev = i > 0 ? buckets[i - 1].total : 0;
    return { label: b.label, total: b.total, change: i > 0 && prev > 0 ? ((b.total - prev) / prev) * 100 : null };
  });
}

export function pctLabel(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}
