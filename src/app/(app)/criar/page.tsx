import { requireUser } from "@/lib/auth";
import { NICHES } from "@/lib/niches";
import { PLANS, PLAN_ORDER, planFeatures } from "@/lib/plans";
import { Wizard } from "./Wizard";

export default async function CriarPage() {
  const user = await requireUser();
  const plan = planFeatures(user.plan);
  // Para cada nicho bloqueado, mostramos o menor plano que o libera.
  const niches = NICHES.map((n, i) => {
    const unlockPlan = PLAN_ORDER.find((p) => i < PLANS[p].maxNiches)!;
    return { ...n, locked: i >= plan.maxNiches, unlockLabel: PLANS[unlockPlan].label };
  });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="h1">Criar página</h1>
        <p className="muted">Responda o questionário e geramos o prompt da sua landing page.</p>
      </div>
      <Wizard niches={niches} allowSections={plan.sections} planLabel={plan.label} />
    </div>
  );
}
