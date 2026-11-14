import { db } from "./db";

// Visitas, visitantes únicos e cliques em CTA dos últimos N dias, com série diária.
export async function pageStats(pageIds: string[], days = 30) {
  const since = new Date(Date.now() - days * 86400_000);
  if (pageIds.length === 0) return { views: 0, visitors: 0, clicks: 0, series: [] as { day: string; views: number }[] };
  const events = await db.pageEvent.findMany({
    where: { pageId: { in: pageIds }, createdAt: { gte: since } },
    select: { type: true, visitorId: true, createdAt: true },
  });
  const views = events.filter((e) => e.type === "view");
  const byDay = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) byDay.set(new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10), 0);
  for (const v of views) {
    const d = v.createdAt.toISOString().slice(0, 10);
    if (byDay.has(d)) byDay.set(d, (byDay.get(d) ?? 0) + 1);
  }
  return {
    views: views.length,
    visitors: new Set(views.map((v) => v.visitorId)).size,
    clicks: events.filter((e) => e.type === "click").length,
    series: [...byDay].map(([day, n]) => ({ day, views: n })),
  };
}
