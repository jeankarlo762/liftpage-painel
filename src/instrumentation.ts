// Roda uma vez quando o servidor sobe. Se DEMO_EMAIL e DEMO_PASSWORD estiverem definidos,
// garante que exista um login de demonstração (Premium vitalício) com essa senha.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const email = process.env.DEMO_EMAIL?.trim().toLowerCase();
  const password = process.env.DEMO_PASSWORD;
  if (!email || !password) return;
  try {
    const [{ db }, bcrypt] = await Promise.all([import("./lib/db"), import("bcryptjs")]);
    const passwordHash = await bcrypt.hash(password, 10);
    const sub = { plan: "PREMIUM" as const, status: "ACTIVE" as const, billing: "LIFETIME" as const, currentPeriodEnd: null };
    await db.user.upsert({
      where: { email },
      update: { passwordHash, subscription: { upsert: { create: sub, update: sub } } },
      create: { name: process.env.DEMO_NAME || "Demonstração", email, passwordHash, subscription: { create: sub } },
    });
    console.log(`[demo] login de demonstração pronto: ${email}`);
  } catch (e) {
    console.error("[demo] não foi possível criar o login de demonstração", e);
  }
}
