// Páginas hospedadas na LiftPage ficam em {SITE_URL}/{slug}, ex.: https://liftpage.com.br/barbearia-do-ze.
export function siteUrl() {
  return (process.env.PUBLIC_SITE_URL || process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function hostedUrl(slug: string) {
  return `${siteUrl()}/${slug}`;
}

// Caminhos do próprio painel que nenhuma página pode usar como endereço.
export const RESERVED_SLUGS = new Set([
  "api", "_next", "dashboard", "criar", "paginas", "perfil", "assinatura", "login", "cadastro", "landing.html",
  "logo-simbolo.svg", "icon.svg", "favicon.ico", "robots.txt", "sitemap.xml", "admin", "app", "painel", "suporte",
  "planos", "precos", "termos", "privacidade", "blog", "ajuda", "contato", "sobre", "configuracoes", "dominios",
]);

export function slugify(s: string) {
  const slug =
    s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "pagina";
  return RESERVED_SLUGS.has(slug) ? `${slug}-site` : slug;
}

// Ajusta os caminhos relativos "assets/..." para funcionarem em /{slug} e injeta o script de estatísticas.
export function renderHostedHtml(html: string, slug: string, snippet: string) {
  const fixed = html
    .replace(/((?:src|href|poster|content)\s*=\s*["'])(?:\.\/)?assets\//gi, `$1/${slug}/assets/`)
    .replace(/(url\(\s*["']?)(?:\.\/)?assets\//gi, `$1/${slug}/assets/`)
    .replace(/(srcset\s*=\s*["'][^"']*)/gi, (m) => m.replace(/(^|[\s,"'])(?:\.\/)?assets\//g, `$1/${slug}/assets/`));
  return fixed.includes("</body>") ? fixed.replace("</body>", `${snippet}\n</body>`) : fixed + snippet;
}
