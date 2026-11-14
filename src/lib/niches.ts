import type { Plan } from "@prisma/client";
import { PLANS } from "./plans";

// Catálogo de 50 nichos. A ordem define o que cada plano libera:
// os 15 primeiros no Basic, os 30 primeiros no Pro e todos os 50 no Premium.
export const NICHES: { id: string; label: string }[] = [
  // Basic (1–15)
  { id: "restaurante", label: "Restaurante" },
  { id: "salao-beleza", label: "Salão de beleza" },
  { id: "barbearia", label: "Barbearia" },
  { id: "academia", label: "Academia" },
  { id: "clinica-odontologica", label: "Clínica odontológica" },
  { id: "advocacia", label: "Advocacia" },
  { id: "contabilidade", label: "Contabilidade" },
  { id: "imobiliaria", label: "Imobiliária" },
  { id: "pet-shop", label: "Pet shop" },
  { id: "loja-roupas", label: "Loja de roupas" },
  { id: "oficina-mecanica", label: "Oficina mecânica" },
  { id: "psicologia", label: "Psicologia" },
  { id: "nutricionista", label: "Nutricionista" },
  { id: "fotografia", label: "Fotografia" },
  { id: "arena-esportiva", label: "Arena / quadra esportiva" },
  // Pro (16–30)
  { id: "clinica-estetica", label: "Clínica de estética" },
  { id: "personal-trainer", label: "Personal trainer" },
  { id: "escola-idiomas", label: "Escola de idiomas" },
  { id: "curso-online", label: "Curso online / infoproduto" },
  { id: "consultoria", label: "Consultoria" },
  { id: "agencia-marketing", label: "Agência de marketing" },
  { id: "construtora", label: "Construtora" },
  { id: "arquitetura", label: "Arquitetura e interiores" },
  { id: "eventos", label: "Eventos e buffet" },
  { id: "hotel-pousada", label: "Hotel / pousada" },
  { id: "confeitaria", label: "Confeitaria" },
  { id: "hamburgueria-delivery", label: "Hamburgueria / delivery" },
  { id: "clinica-veterinaria", label: "Clínica veterinária" },
  { id: "fisioterapia", label: "Fisioterapia" },
  { id: "energia-solar", label: "Energia solar" },
  // Premium (31–50)
  { id: "saas", label: "SaaS / software" },
  { id: "startup", label: "Startup" },
  { id: "ecommerce", label: "E-commerce" },
  { id: "medico", label: "Consultório médico" },
  { id: "laboratorio", label: "Laboratório" },
  { id: "escola", label: "Escola / colégio" },
  { id: "igreja", label: "Igreja / comunidade" },
  { id: "ong", label: "ONG / causa social" },
  { id: "politico", label: "Candidato / político" },
  { id: "musico-banda", label: "Músico / banda" },
  { id: "influenciador", label: "Influenciador / criador" },
  { id: "coach", label: "Coach / mentor" },
  { id: "corretor-seguros", label: "Corretor de seguros" },
  { id: "financeira", label: "Financeira / crédito" },
  { id: "autoescola", label: "Autoescola" },
  { id: "transportadora", label: "Transportadora / logística" },
  { id: "marcenaria", label: "Marcenaria / móveis planejados" },
  { id: "limpeza", label: "Limpeza e conservação" },
  { id: "turismo", label: "Agência de turismo" },
  { id: "joalheria", label: "Joalheria / acessórios" },
];

export function nichesForPlan(plan: Plan) {
  return NICHES.slice(0, PLANS[plan].maxNiches);
}

export function isNicheAllowed(plan: Plan, nicheId: string) {
  return nichesForPlan(plan).some((n) => n.id === nicheId);
}

export function nicheLabel(id: string) {
  return NICHES.find((n) => n.id === id)?.label ?? id;
}
