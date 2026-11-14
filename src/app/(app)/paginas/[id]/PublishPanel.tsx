"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Bot, Check, ClipboardCopy, Loader2, Upload } from "lucide-react";
import type { PageStatus } from "@prisma/client";
import { deleteDraft, publishPasted, publishWithAgent, savePrompt } from "../actions";

const BUSY: PageStatus[] = ["GENERATING", "PUSHING", "DEPLOYING"];
const STAGES: { key: PageStatus; label: string }[] = [
  { key: "GENERATING", label: "Gerando a página" },
  { key: "PUSHING", label: "Criando repositório no GitHub" },
  { key: "DEPLOYING", label: "Publicando no Railway" },
  { key: "LIVE", label: "No ar" },
];

export function PublishPanel(p: {
  pageId: string;
  status: PageStatus;
  prompt: string;
  statusLog: string | null;
  error: string | null;
  hasAgent: boolean;
  canPublish: boolean;
  published: boolean;
  assets: string[];
}) {
  const router = useRouter();
  const [prompt, setPrompt] = useState(p.prompt);
  const [html, setHtml] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const busy = BUSY.includes(p.status);

  // Atualiza a tela enquanto a publicação roda em segundo plano.
  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(t);
  }, [busy, router]);

  const copy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const run = (fn: () => Promise<{ error?: string } | void>) =>
    start(async () => {
      setError(null);
      const res = await fn();
      if (res && "error" in res && res.error) setError(res.error);
      router.refresh();
    });

  const stageIdx = STAGES.findIndex((s) => s.key === p.status);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Prompt da página</h2>
          <button className="btn-ghost" onClick={copy}>
            {copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />} {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
        <textarea className="input min-h-[360px] font-mono text-xs leading-relaxed" value={prompt} onChange={(e) => setPrompt(e.target.value)} disabled={p.published} />
        {prompt !== p.prompt && (
          <button className="btn-ghost" disabled={pending} onClick={() => run(() => savePrompt(p.pageId, prompt))}>Salvar alterações no prompt</button>
        )}
        {p.assets.length > 0 && <p className="muted">Arquivos enviados: {p.assets.join(" · ")}</p>}
      </div>

      <div className="card space-y-5">
        <h2 className="font-semibold">Criar página</h2>

        {(busy || p.status === "LIVE") && (
          <ol className="space-y-3">
            {STAGES.filter((s) => p.hasAgent || s.key !== "GENERATING").map((s) => {
              const idx = STAGES.findIndex((x) => x.key === s.key);
              const done = idx < stageIdx || p.status === "LIVE";
              const current = idx === stageIdx && busy;
              return (
                <li key={s.key} className="flex items-center gap-3 text-sm">
                  {done ? <Check className="h-4 w-4 text-emerald-600" /> : current ? <Loader2 className="h-4 w-4 animate-spin text-brand-600" /> : <span className="h-4 w-4 rounded-full border border-slate-300" />}
                  <span className={done || current ? "font-medium" : "text-ink-300"}>{s.label}</span>
                </li>
              );
            })}
          </ol>
        )}

        {p.status === "FAILED" && p.error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{p.error}</p>}

        {!p.published && !busy && (
          <>
            {!p.canPublish && (
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Conecte seu GitHub e seu Railway em <Link href="/configuracoes" className="font-semibold underline">Configurações</Link> para publicar.
              </p>
            )}
            {p.hasAgent ? (
              <div className="space-y-3">
                <p className="muted">O agente Claude usa o prompt ao lado, cria o código, o repositório e publica no Railway sozinho.</p>
                <button className="btn-primary w-full" disabled={pending || !p.canPublish} onClick={() => run(() => publishWithAgent(p.pageId))}>
                  <Bot className="h-4 w-4" /> {pending ? "Iniciando…" : "Criar página com o agente"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <ol className="muted list-decimal space-y-1 pl-5">
                  <li>Copie o prompt e cole no Claude (claude.ai).</li>
                  <li>Copie o HTML que o Claude devolver e cole abaixo.</li>
                  <li>Clique em publicar: criamos o repositório e subimos no Railway.</li>
                </ol>
                <textarea className="input min-h-40 font-mono text-xs" placeholder="<!DOCTYPE html>…" value={html} onChange={(e) => setHtml(e.target.value)} />
                <button className="btn-primary w-full" disabled={pending || !p.canPublish || html.trim().length < 50} onClick={() => run(() => publishPasted(p.pageId, html))}>
                  <Upload className="h-4 w-4" /> {pending ? "Enviando…" : "Publicar página"}
                </button>
              </div>
            )}
            {(p.status === "DRAFT" || p.status === "FAILED") && (
              <button className="text-sm text-ink-500 hover:text-red-600" disabled={pending} onClick={() => start(async () => { await deleteDraft(p.pageId); router.push("/paginas"); })}>
                Excluir rascunho
              </button>
            )}
          </>
        )}

        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {p.statusLog && (
          <details className="text-xs text-ink-500">
            <summary className="cursor-pointer">Histórico</summary>
            <pre className="mt-2 whitespace-pre-wrap">{p.statusLog}</pre>
          </details>
        )}
      </div>
    </div>
  );
}
