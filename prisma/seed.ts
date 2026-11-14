// Dados de demonstração: npm run db:seed
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo12345", 10);
  const user = await db.user.upsert({
    where: { email: "demo@liftpage.dev" },
    update: {},
    create: {
      name: "Conta Demo",
      email: "demo@liftpage.dev",
      passwordHash,
      subscription: { create: { plan: "PREMIUM", status: "ACTIVE", billing: "LIFETIME", paymentMethod: "Pix" } },
    },
  });
  const page = await db.page.upsert({
    where: { slug: "barbearia-do-ze" },
    update: {},
    create: {
      userId: user.id,
      name: "Barbearia do Zé",
      slug: "barbearia-do-ze",
      niche: "barbearia",
      siteType: "SECTIONS",
      template: "CRIATIVO",
      colors: ["#111827", "#f59e0b"],
      briefing: {},
      prompt: "Crie uma landing page completa…",
      status: "LIVE",
      url: "https://barbearia-do-ze.up.railway.app",
      repoUrl: "https://github.com/exemplo/lp-barbearia-do-ze",
      publishedAt: new Date(),
    },
  });
  if ((await db.pageEvent.count({ where: { pageId: page.id } })) === 0) {
    const events = [];
    for (let d = 0; d < 30; d++) {
      const n = 20 + Math.round(Math.random() * 40 + d * 1.5);
      for (let i = 0; i < n; i++) {
        const createdAt = new Date(Date.now() - (29 - d) * 86400_000);
        events.push({ pageId: page.id, type: "view", visitorId: `v${d}-${i % 25}`, createdAt });
        if (Math.random() < 0.08) events.push({ pageId: page.id, type: "click", visitorId: `v${d}-${i}`, label: Math.random() < 0.6 ? "agendar-hero" : "whatsapp-flutuante", createdAt });
      }
    }
    await db.pageEvent.createMany({ data: events });
  }
  console.log("Login demo: demo@liftpage.dev / demo12345");
}

main().finally(() => db.$disconnect());
