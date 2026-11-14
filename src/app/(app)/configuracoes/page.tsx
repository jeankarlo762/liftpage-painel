import { FolderGit2, TrainFront } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { planFeatures } from "@/lib/plans";
import { DisconnectButton, TokenForm } from "./Forms";

export default async function ConfiguracoesPage({ searchParams }: { searchParams: Promise<{ github?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const plan = planFeatures(user.plan);
  const gh = user.connections.find((c) => c.provider === "github");
  const rw = user.connections.find((c) => c.provider === "railway");
  const oauth = !!process.env.GITHUB_CLIENT_ID;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="h1">Configurações</h1>
        <p className="muted">
          Conecte suas contas para publicar as páginas.
          {plan.autoHosting && " No Premium a hospedagem é automática; conectar suas contas é opcional."}
        </p>
      </div>
      {sp.github === "ok" && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">GitHub conectado.</p>}
      {sp.github === "erro" && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">Não foi possível conectar o GitHub. Tente de novo.</p>}

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FolderGit2 className="h-6 w-6" />
            <div>
              <div className="font-semibold">GitHub</div>
              <div className="muted">{gh ? `Conectado como ${gh.accountName}` : "Onde criamos o repositório de cada página"}</div>
            </div>
          </div>
          {gh ? <DisconnectButton provider="github" /> : oauth && <a href="/api/github/connect" className="btn-primary">Conectar GitHub</a>}
        </div>
        {!gh && (
          <details className="text-sm">
            <summary className="cursor-pointer text-ink-500">{oauth ? "Prefere usar um token?" : "Conectar com token pessoal"}</summary>
            <div className="mt-3 space-y-2">
              <p className="muted">Crie um token clássico em github.com/settings/tokens com o escopo <code>repo</code>.</p>
              <TokenForm provider="github" placeholder="ghp_…" />
            </div>
          </details>
        )}
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrainFront className="h-6 w-6" />
            <div>
              <div className="font-semibold">Railway</div>
              <div className="muted">{rw ? `Conectado: ${rw.accountName}` : "Onde a página fica hospedada"}</div>
            </div>
          </div>
          {rw && <DisconnectButton provider="railway" />}
        </div>
        {!rw && (
          <div className="space-y-2 text-sm">
            <p className="muted">
              Em railway.com/account/tokens crie um token e cole abaixo. Sua conta Railway precisa estar ligada ao GitHub para fazer deploy dos repositórios.
            </p>
            <TokenForm provider="railway" placeholder="Token do Railway" />
          </div>
        )}
      </div>
    </div>
  );
}
