import { z } from "zod";
import { nicheLabel } from "./niches";

export const SECTION_OPTIONS = [
  { id: "sobre", label: "Sobre" },
  { id: "servicos", label: "Serviços / produtos" },
  { id: "diferenciais", label: "Diferenciais" },
  { id: "depoimentos", label: "Depoimentos" },
  { id: "galeria", label: "Galeria" },
  { id: "planos", label: "Planos e preços" },
  { id: "equipe", label: "Equipe" },
  { id: "faq", label: "Perguntas frequentes" },
  { id: "contato", label: "Contato e mapa" },
] as const;

export const TEMPLATE_INFO = {
  PROFISSIONAL: { label: "Profissional", desc: "Limpo, confiável, foco em conversão" },
  CORPORATIVO: { label: "Corporativo", desc: "Sóbrio, institucional, empresas maiores" },
  PESSOAL: { label: "Pessoal", desc: "Próximo, humano, marca pessoal" },
  CRIATIVO: { label: "Criativo", desc: "Ousado, cores fortes, tipografia marcante" },
} as const;

export const briefingSchema = z.object({
  businessName: z.string().trim().min(2, "Informe o nome do negócio"),
  niche: z.string().min(1, "Escolha um nicho"),
  siteType: z.enum(["SINGLE", "SECTIONS"]),
  template: z.enum(["PROFISSIONAL", "CORPORATIVO", "PESSOAL", "CRIATIVO"]),
  colors: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).min(1).max(4),
  description: z.string().trim().min(10, "Descreva o negócio em pelo menos uma frase"),
  audience: z.string().trim().optional().default(""),
  offer: z.string().trim().optional().default(""),
  cta: z.string().trim().min(2, "Qual é a ação principal?"),
  whatsapp: z.string().trim().optional().default(""),
  email: z.string().trim().optional().default(""),
  instagram: z.string().trim().optional().default(""),
  address: z.string().trim().optional().default(""),
  sections: z.array(z.string()).default([]),
  extra: z.string().trim().optional().default(""),
});

export type Briefing = z.infer<typeof briefingSchema>;
export type AssetRef = { kind: string; filename: string; publicPath: string };

// Monta o prompt final a partir do questionário e dos arquivos enviados.
// O mesmo texto serve para colar no Claude (Basic/Pro) e para o agente (Premium).
export function buildPrompt(b: Briefing, assets: AssetRef[]) {
  const logo = assets.find((a) => a.kind === "logo");
  const images = assets.filter((a) => a.kind === "image");
  const tpl = TEMPLATE_INFO[b.template];
  const sections =
    b.siteType === "SECTIONS"
      ? b.sections
          .map((id) => SECTION_OPTIONS.find((s) => s.id === id)?.label ?? id)
          .join(", ") || "Sobre, Serviços, Depoimentos, FAQ e Contato"
      : null;

  const lines: string[] = [];
  lines.push(
    `Crie uma landing page completa, moderna e responsiva para "${b.businessName}", do nicho ${nicheLabel(b.niche)}.`,
    "",
    "## Sobre o negócio",
    b.description,
  );
  if (b.audience) lines.push("", `Público-alvo: ${b.audience}`);
  if (b.offer) lines.push("", `Oferta / serviços principais: ${b.offer}`);

  lines.push(
    "",
    "## Estrutura",
    b.siteType === "SINGLE"
      ? "Página única e objetiva: hero com título forte e chamada para ação, benefícios, prova social curta e rodapé com contato."
      : `Página com sessões e menu fixo com âncoras. Sessões, nesta ordem, depois do hero: ${sections}.`,
    `Ação principal (CTA): ${b.cta}. Repita o botão no hero, no meio e no final da página.`,
  );

  lines.push(
    "",
    "## Visual",
    `Estilo ${tpl.label}: ${tpl.desc}.`,
    `Paleta: ${b.colors.join(", ")} (a primeira é a cor principal). Garanta contraste AA no texto.`,
    logo
      ? `Logo: use o arquivo "${logo.publicPath}" no topo e no rodapé.`
      : `Sem logo: crie um logotipo tipográfico simples com o nome "${b.businessName}".`,
  );
  if (images.length) {
    lines.push(`Imagens disponíveis (use todas onde fizer sentido, com alt descritivo): ${images.map((i) => `"${i.publicPath}"`).join(", ")}.`);
  } else {
    lines.push("Sem fotos enviadas: use formas, gradientes e ícones SVG inline em vez de imagens externas.");
  }

  const contacts = [
    b.whatsapp && `WhatsApp: ${b.whatsapp} (botão flutuante e links https://wa.me/55${b.whatsapp.replace(/\D/g, "").replace(/^55/, "")})`,
    b.email && `E-mail: ${b.email}`,
    b.instagram && `Instagram: ${b.instagram}`,
    b.address && `Endereço: ${b.address}`,
  ].filter(Boolean);
  if (contacts.length) lines.push("", "## Contato", ...contacts.map((c) => `- ${c}`));
  if (b.extra) lines.push("", "## Observações do cliente", b.extra);

  lines.push(
    "",
    "## Requisitos técnicos",
    "- Entregue um único arquivo index.html com CSS e JS embutidos (sem frameworks nem build).",
    "- Textos em português do Brasil, persuasivos e específicos para o nicho; nada de lorem ipsum.",
    "- Mobile first, carregamento rápido, HTML semântico, meta tags de SEO e Open Graph.",
    "- Fontes do Google Fonts são permitidas; nenhum outro recurso externo.",
    '- Marque cada botão de CTA com o atributo data-cta="nome-do-botao".',
  );
  return lines.join("\n");
}
