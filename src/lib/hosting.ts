// Token do Railway que controla as páginas: sempre o da plataforma.
export async function railwayTokenFor(_page?: { userId: string; hostedByPlatform: boolean }) {
  const t = process.env.PLATFORM_RAILWAY_TOKEN;
  if (!t) throw new Error("PLATFORM_RAILWAY_TOKEN não configurado");
  return t;
}
