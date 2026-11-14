import { db } from "@/lib/db";
import { trackingSnippet } from "@/lib/services/bundle";
import { renderHostedHtml, siteUrl } from "@/lib/site";

// Página do cliente hospedada na LiftPage: liftpage.com.br/{slug}
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await db.page.findUnique({ where: { slug }, select: { id: true, html: true, status: true, hostedByPlatform: true } });
  if (!page || !page.hostedByPlatform || page.status !== "LIVE" || !page.html) {
    return new Response("Página não encontrada", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  }
  const html = renderHostedHtml(page.html, slug, trackingSnippet(siteUrl(), page.id));
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=60",
      // O HTML é gerado ou colado pelo cliente e roda no mesmo domínio do painel: o sandbox
      // dá a ele uma origem isolada, sem acesso aos cookies e sessões do painel.
      "content-security-policy": "sandbox allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-downloads",
      "x-frame-options": "SAMEORIGIN",
    },
  });
}
