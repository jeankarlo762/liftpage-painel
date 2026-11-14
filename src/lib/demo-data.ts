import type { PrismaClient } from "@prisma/client";

// Páginas fictícias da conta de demonstração. A soma dos valores pagos é R$ 15.340,97.
const DEMO_PAGES = [
  { client: "Carlos Mendes", name: "Barbearia Navalha de Ouro", niche: "barbearia", domain: "navalhadeouro.com.br", paid: 1290.0 },
  { client: "Dra. Fernanda Lopes", name: "Sorriso Lopes Odontologia", niche: "clinica-odontologica", domain: "sorrisolopes.com.br", paid: 1890.0 },
  { client: "Rafael Torres", name: "Torres & Brito Advogados", niche: "advocacia", domain: "torresbrito.adv.br", paid: 2150.0 },
  { client: "Juliana Prado", name: "Studio Juliana Prado", niche: "salao-beleza", domain: "studiojulianaprado.com.br", paid: 890.0 },
  { client: "Marcos Vieira", name: "Arena Vila Sports", niche: "arena-esportiva", domain: "arenavilasports.com.br", paid: 1490.0 },
  { client: "Patrícia Ramos", name: "Ramos Imóveis", niche: "imobiliaria", domain: "ramosimoveis.com.br", paid: 1750.0 },
  { client: "Bruno Castilho", name: "Iron Fit Academia", niche: "academia", domain: "ironfitacademia.com.br", paid: 990.0 },
  { client: "Ana Beatriz Souza", name: "Nutri Ana Souza", niche: "nutricionista", domain: "nutrianasouza.com.br", paid: 690.0 },
  { client: "Gustavo Hartmann", name: "Hartmann Energia Solar", niche: "energia-solar", domain: "hartmannsolar.com.br", paid: 1350.0 },
  { client: "Letícia Moraes", name: "Doce Letícia Confeitaria", niche: "confeitaria", domain: "doceleticia.com.br", paid: 590.0 },
  { client: "Thiago Nunes", name: "PetLove Nunes", niche: "pet-shop", domain: "petlovenunes.com.br", paid: 780.0 },
  { client: "Renata Albuquerque", name: "Pousada Mar Azul", niche: "hotel-pousada", domain: "pousadamarazul.com.br", paid: 1480.97 },
];

export async function ensureDemoPages(db: PrismaClient, userId: string) {
  if ((await db.page.count({ where: { userId, slug: { startsWith: "demo-" } } })) > 0) return;
  const day = 86400_000;
  for (const [i, d] of DEMO_PAGES.entries()) {
    const slug = `demo-${d.domain.split(".")[0]}`;
    const publishedAt = new Date(Date.now() - (60 - i * 4) * day);
    const page = await db.page.upsert({
      where: { slug },
      update: { userId },
      create: {
        userId,
        slug,
        name: d.name,
        clientName: d.client,
        domain: d.domain,
        amountPaid: d.paid,
        niche: d.niche,
        siteType: i % 3 === 0 ? "SINGLE" : "SECTIONS",
        template: (["PROFISSIONAL", "CORPORATIVO", "PESSOAL", "CRIATIVO"] as const)[i % 4],
        colors: ["#1A2A6C", "#9DB0FF", "#0A0A0B"],
        briefing: {},
        prompt: `Página de demonstração para ${d.name}.`,
        status: "LIVE",
        url: `https://${d.domain}`,
        publishedAt,
        createdAt: publishedAt,
      },
    });
    const events = [];
    for (let k = 0; k < 30; k++) {
      const createdAt = new Date(Date.now() - (29 - k) * day);
      const n = 6 + ((i * 7 + k * 3) % 11) + Math.floor(k / 3);
      for (let v = 0; v < n; v++) {
        events.push({ pageId: page.id, type: "view", visitorId: `${slug}-${k}-${v % 8}`, createdAt });
        if (v % 9 === 0) events.push({ pageId: page.id, type: "click", visitorId: `${slug}-${k}-${v}`, label: "whatsapp", createdAt });
      }
    }
    await db.pageEvent.createMany({ data: events });
  }
}
