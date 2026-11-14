import { db } from "./db";
import { decrypt } from "./crypto";

// Token do Railway que controla a página: o da plataforma (Premium) ou o do cliente.
export async function railwayTokenFor(page: { userId: string; hostedByPlatform: boolean }) {
  if (page.hostedByPlatform) {
    const t = process.env.PLATFORM_RAILWAY_TOKEN;
    if (!t) throw new Error("PLATFORM_RAILWAY_TOKEN não configurado");
    return t;
  }
  const conn = await db.connection.findUnique({ where: { userId_provider: { userId: page.userId, provider: "railway" } } });
  if (!conn) throw new Error("Conecte o Railway em Configurações");
  return decrypt(conn.tokenEnc);
}
