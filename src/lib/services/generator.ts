import Anthropic from "@anthropic-ai/sdk";

const SYSTEM = `Você é um designer e desenvolvedor front-end sênior especializado em landing pages de alta conversão para negócios brasileiros.
Siga o briefing do usuário à risca. Responda apenas com o conteúdo do arquivo index.html completo, começando em <!DOCTYPE html> e terminando em </html>, sem comentários antes ou depois e sem cercas de código.`;

export type GenImage = { publicPath: string; mimeType: string; data: Buffer };

export class GenerationError extends Error {}

export function agentConfigured() {
  return !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

// Agente de criação (plano Premium): gera o index.html a partir do prompt e das imagens enviadas.
export async function generateLandingHtml(prompt: string, images: GenImage[]) {
  if (!agentConfigured()) throw new GenerationError("O agente de criação ainda não foi configurado pela LiftPage. Fale com o suporte.");
  const client = new Anthropic();
  const model = process.env.CLAUDE_MODEL || "claude-opus-5-5";

  // As imagens vão junto para o modelo enxergar logo e fotos e escolher cores e layout coerentes.
  const content: Anthropic.Beta.Messages.BetaContentBlockParam[] = [];
  for (const img of images.slice(0, 8)) {
    if (!/^image\/(png|jpeg|webp|gif)$/.test(img.mimeType)) continue;
    content.push({ type: "text", text: `Arquivo ${img.publicPath}:` });
    content.push({
      type: "image",
      source: { type: "base64", media_type: img.mimeType as "image/png", data: img.data.toString("base64") },
    });
  }
  content.push({ type: "text", text: prompt });

  const stream = client.beta.messages.stream({
    model,
    max_tokens: 64000,
    system: SYSTEM,
    output_config: { effort: "high" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    messages: [{ role: "user", content }],
  });
  const msg = await stream.finalMessage().catch((e: unknown) => {
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) {
      throw new GenerationError("A chave do agente de criação foi recusada. Fale com o suporte.");
    }
    if (e instanceof Anthropic.RateLimitError || e instanceof Anthropic.InternalServerError) {
      throw new GenerationError("O agente está ocupado agora. Tente de novo em alguns minutos.");
    }
    throw e;
  });

  if (msg.stop_reason === "refusal") throw new GenerationError("O modelo recusou o pedido. Revise o conteúdo do briefing.");
  if (msg.stop_reason === "max_tokens") throw new GenerationError("A página ficou grande demais e foi cortada. Tente reduzir as sessões.");

  const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  return extractHtml(text);
}

// Aceita a resposta do agente ou o código colado pelo usuário (Pro), com ou sem cerca de código.
export function extractHtml(raw: string) {
  const fenced = raw.match(/```(?:html)?\s*([\s\S]*?)```/i);
  const body = (fenced ? fenced[1] : raw).trim();
  const start = body.search(/<!doctype html|<html/i);
  const end = body.toLowerCase().lastIndexOf("</html>");
  if (start === -1 || end === -1) throw new GenerationError("Não encontrei um HTML completo (de <!DOCTYPE html> até </html>).");
  return body.slice(start, end + "</html>".length);
}
