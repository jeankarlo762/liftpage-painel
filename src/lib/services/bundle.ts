import type { RepoFile } from "./github";

// Script de estatísticas injetado em toda página publicada: conta visitas e cliques nos CTAs.
export function trackingSnippet(appUrl: string, pageId: string) {
  return `<script>(function(){var u=${JSON.stringify(appUrl.replace(/\/$/, "") + "/api/track")},p=${JSON.stringify(pageId)};
var v=localStorage.getItem("lpv");if(!v){v=Math.random().toString(36).slice(2);try{localStorage.setItem("lpv",v)}catch(e){}}
function s(t,l){try{navigator.sendBeacon(u,JSON.stringify({pageId:p,type:t,path:location.pathname,referrer:document.referrer,visitorId:v,label:l}))}catch(e){}}
s("view");document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("[data-cta],a[href*='wa.me']");if(a)s("click",a.getAttribute("data-cta")||a.getAttribute("href"))});})();</script>`;
}

const SERVER_JS = `// Servidor estático sem dependências para o Railway.
const http = require("http");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "public");
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml", ".ico": "image/x-icon" };
http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || "/").split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const file = path.normalize(path.join(root, p));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) {
      return fs.readFile(path.join(root, "index.html"), (e2, html) => { res.writeHead(e2 ? 404 : 200, { "Content-Type": types[".html"] }); res.end(html); });
    }
    res.writeHead(200, { "Content-Type": types[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "public, max-age=300" });
    res.end(data);
  });
}).listen(process.env.PORT || 3000);
`;

export function buildSiteFiles(opts: {
  slug: string;
  html: string;
  pageId: string;
  appUrl: string;
  assets: { publicPath: string; data: Buffer }[];
}): RepoFile[] {
  const html = opts.html.includes("</body>")
    ? opts.html.replace("</body>", `${trackingSnippet(opts.appUrl, opts.pageId)}\n</body>`)
    : opts.html + trackingSnippet(opts.appUrl, opts.pageId);
  return [
    { path: "public/index.html", content: html },
    ...opts.assets.map((a) => ({ path: `public/${a.publicPath}`, content: a.data })),
    { path: "server.js", content: SERVER_JS },
    {
      path: "package.json",
      content: JSON.stringify({ name: opts.slug, private: true, scripts: { start: "node server.js" }, engines: { node: ">=18" } }, null, 2),
    },
    { path: "README.md", content: `# ${opts.slug}\n\nLanding page gerada automaticamente. O conteúdo fica em \`public/\`.\n` },
  ];
}
