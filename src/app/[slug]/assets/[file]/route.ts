import { db } from "@/lib/db";
import { assetPublicPath } from "@/lib/services/pipeline";

// Logo e imagens das páginas hospedadas: liftpage.com.br/{slug}/assets/{arquivo}
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string; file: string }> }) {
  const { slug, file } = await params;
  const page = await db.page.findUnique({ where: { slug }, select: { hostedByPlatform: true, status: true, assets: { select: { id: true, kind: true, filename: true, mimeType: true, data: true } } } });
  const asset = page?.hostedByPlatform && page.status === "LIVE" ? page.assets.find((a) => assetPublicPath(a) === `assets/${file}`) : null;
  if (!asset) return new Response("Não encontrado", { status: 404 });
  const safeType = /^image\/(png|jpeg|webp|gif|svg\+xml)$/.test(asset.mimeType) ? asset.mimeType : "application/octet-stream";
  return new Response(new Uint8Array(asset.data), {
    headers: {
      "content-type": safeType,
      "cache-control": "public, max-age=86400",
      "x-content-type-options": "nosniff",
      // SVG pode ter script: aberto direto, roda isolado e sem scripts.
      "content-security-policy": "default-src 'none'; img-src data:; style-src 'unsafe-inline'; sandbox",
    },
  });
}
