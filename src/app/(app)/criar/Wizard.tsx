"use client";

import { useMemo, useState, useTransition } from "react";
import clsx from "clsx";
import { Check, ImagePlus, Lock, Search } from "lucide-react";
import { SECTION_OPTIONS, TEMPLATE_INFO, type Briefing } from "@/lib/prompt";
import { createDraft } from "./actions";

type Niche = { id: string; label: string; locked: boolean; unlockLabel: string };

const STEPS = ["Cliente", "Nicho", "Tipo de site", "Modelo", "Cores", "Logo e imagens", "Seu negócio"];
const PALETTES = [
  ["#1e40af", "#f59e0b", "#0f172a"],
  ["#047857", "#d1fae5", "#111827"],
  ["#be123c", "#fde68a", "#1f2937"],
  ["#7c3aed", "#22d3ee", "#0b1020"],
  ["#111827", "#e5e7eb", "#f97316"],
  ["#0e7490", "#fef3c7", "#1e293b"],
];

export function Wizard({ niches, allowSections, planLabel }: { niches: Niche[]; allowSections: boolean; planLabel: string }) {
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [logo, setLogo] = useState<File | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [b, setB] = useState<Briefing>({
    businessName: "",
    niche: "",
    siteType: "SINGLE",
    template: "PROFISSIONAL",
    colors: PALETTES[0],
    description: "",
    audience: "",
    offer: "",
    cta: "Falar no WhatsApp",
    whatsapp: "",
    email: "",
    instagram: "",
    address: "",
    sections: ["sobre", "servicos", "depoimentos", "faq", "contato"],
    extra: "",
  });
  const [client, setClient] = useState({ name: "", domain: "", paid: "" });
  const paidValue = parseMoney(client.paid);
  const set = <K extends keyof Briefing>(k: K, v: Briefing[K]) => setB((prev) => ({ ...prev, [k]: v }));

  const filtered = useMemo(
    () => niches.filter((n) => n.label.toLowerCase().includes(query.toLowerCase())),
    [niches, query],
  );

  const canNext = [
    client.name.trim().length >= 2 && paidValue != null,
    !!b.niche,
    true,
    true,
    b.colors.length > 0,
    true,
    b.businessName.trim().length >= 2 && b.description.trim().length >= 10 && b.cta.trim().length >= 2,
  ][step];

  function submit() {
    setError(null);
    const fd = new FormData();
    fd.set("briefing", JSON.stringify(b));
    fd.set("clientName", client.name);
    fd.set("domain", client.domain);
    fd.set("amountPaid", String(paidValue ?? ""));
    if (logo) fd.set("logo", logo);
    images.forEach((f) => fd.append("images", f));
    start(async () => {
      const res = await createDraft(fd);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <ol className="card h-fit space-y-1 p-3">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              className={clsx(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm",
                i === step ? "bg-brand-600/25 font-semibold text-brand-300" : i < step ? "text-ink-700" : "text-ink-300",
              )}
            >
              <span className={clsx("grid h-6 w-6 place-items-center rounded-full text-xs", i < step ? "bg-brand-600 text-white" : "border border-current")}>
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              {s}
            </button>
          </li>
        ))}
      </ol>

      <div className="card space-y-6">
        {step === 0 && (
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <h2 className="text-lg font-semibold">Cliente</h2>
              <p className="muted">Para quem é esta página e quanto o cliente pagou. Aparece em Páginas publicadas e na receita do Dashboard.</p>
            </div>
            <Field label="Nome do cliente *" value={client.name} onChange={(v) => setClient({ ...client, name: v })} placeholder="Ex.: Carlos Silva" />
            <Field label="Valor pago (R$) *" value={client.paid} onChange={(v) => setClient({ ...client, paid: v })} placeholder="Ex.: 1.200,00" />
            <Field className="sm:col-span-2" label="Domínio da página" value={client.domain} onChange={(v) => setClient({ ...client, domain: v })} placeholder="Ex.: barbeariadocarlos.com.br" />
          </section>
        )}

        {step === 1 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Qual é o nicho do negócio?</h2>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-ink-300" />
              <input className="input pl-9" placeholder="Buscar nicho" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="grid max-h-[420px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  disabled={n.locked}
                  onClick={() => set("niche", n.id)}
                  className={clsx(
                    "flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm",
                    b.niche === n.id ? "border-brand-500 bg-brand-600/25 font-semibold text-brand-300" : "border-linha hover:border-brand-300",
                    n.locked && "cursor-not-allowed opacity-50 hover:border-linha",
                  )}
                >
                  {n.label}
                  {n.locked && (
                    <span className="flex items-center gap-1 text-[11px] text-ink-500">
                      <Lock className="h-3 w-3" /> {n.unlockLabel}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <p className="muted">Seu plano {planLabel} libera {niches.filter((n) => !n.locked).length} de {niches.length} nichos.</p>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Tipo de site</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Choice active={b.siteType === "SINGLE"} onClick={() => set("siteType", "SINGLE")} title="Página única" desc="Uma landing page direta, focada em uma ação." />
              <Choice
                active={b.siteType === "SECTIONS"}
                locked={!allowSections}
                lockText="Disponível no Pro"
                onClick={() => set("siteType", "SECTIONS")}
                title="Com sessões"
                desc="Menu com sessões: sobre, serviços, depoimentos e mais."
              />
            </div>
            {b.siteType === "SECTIONS" && (
              <div>
                <p className="label">Quais sessões?</p>
                <div className="flex flex-wrap gap-2">
                  {SECTION_OPTIONS.map((s) => {
                    const on = b.sections.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => set("sections", on ? b.sections.filter((x) => x !== s.id) : [...b.sections, s.id])}
                        className={clsx("rounded-full border px-3 py-1.5 text-sm", on ? "border-brand-500 bg-brand-600/25 text-brand-300" : "border-linha")}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {step === 3 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Modelo</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(Object.keys(TEMPLATE_INFO) as (keyof typeof TEMPLATE_INFO)[]).map((t) => (
                <Choice key={t} active={b.template === t} onClick={() => set("template", t)} title={TEMPLATE_INFO[t].label} desc={TEMPLATE_INFO[t].desc} />
              ))}
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="space-y-5">
            <h2 className="text-lg font-semibold">Cores</h2>
            <div className="flex flex-wrap gap-3">
              {PALETTES.map((p) => (
                <button
                  key={p.join()}
                  type="button"
                  onClick={() => set("colors", p)}
                  className={clsx("flex overflow-hidden rounded-xl border-2", b.colors.join() === p.join() ? "border-brand-500" : "border-transparent")}
                  aria-label={`Paleta ${p.join(", ")}`}
                >
                  {p.map((c) => <span key={c} className="h-10 w-10" style={{ background: c }} />)}
                </button>
              ))}
            </div>
            <div>
              <p className="label">Ou escolha as suas (a primeira é a principal)</p>
              <div className="flex flex-wrap items-center gap-3">
                {b.colors.map((c, i) => (
                  <label key={i} className="flex items-center gap-2 rounded-xl border border-linha px-2 py-1.5 text-sm">
                    <input
                      type="color"
                      value={c}
                      onChange={(e) => set("colors", b.colors.map((x, j) => (j === i ? e.target.value : x)))}
                      className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent"
                    />
                    {c}
                    {b.colors.length > 1 && (
                      <button type="button" className="text-ink-300 hover:text-red-500" onClick={() => set("colors", b.colors.filter((_, j) => j !== i))}>×</button>
                    )}
                  </label>
                ))}
                {b.colors.length < 4 && (
                  <button type="button" className="btn-ghost" onClick={() => set("colors", [...b.colors, "#64748b"])}>+ cor</button>
                )}
              </div>
            </div>
          </section>
        )}

        {step === 5 && (
          <section className="space-y-5">
            <h2 className="text-lg font-semibold">Logo e imagens</h2>
            <div>
              <p className="label">Logo (opcional)</p>
              <FilePick accept="image/*" onFiles={(f) => setLogo(f[0] ?? null)} files={logo ? [logo] : []} />
            </div>
            <div>
              <p className="label">Imagens do negócio (até 8, 4 MB cada)</p>
              <FilePick accept="image/*" multiple onFiles={(f) => setImages((prev) => [...prev, ...f].slice(0, 8))} files={images} onRemove={(i) => setImages(images.filter((_, j) => j !== i))} />
            </div>
          </section>
        )}

        {step === 6 && (
          <section className="grid gap-4 sm:grid-cols-2">
            <h2 className="text-lg font-semibold sm:col-span-2">Sobre o seu negócio</h2>
            <Field label="Nome do negócio *" value={b.businessName} onChange={(v) => set("businessName", v)} />
            <Field label="Ação principal (CTA) *" value={b.cta} onChange={(v) => set("cta", v)} placeholder="Ex.: Agendar horário" />
            <Field className="sm:col-span-2" textarea label="O que o negócio faz? *" value={b.description} onChange={(v) => set("description", v)} placeholder="Ex.: Barbearia no centro de Curitiba com corte e barba, ambiente com sinuca e cerveja" />
            <Field label="Público-alvo" value={b.audience} onChange={(v) => set("audience", v)} />
            <Field label="Serviços / oferta" value={b.offer} onChange={(v) => set("offer", v)} />
            <Field label="WhatsApp" value={b.whatsapp} onChange={(v) => set("whatsapp", v)} placeholder="(41) 99999-9999" />
            <Field label="E-mail" value={b.email} onChange={(v) => set("email", v)} />
            <Field label="Instagram" value={b.instagram} onChange={(v) => set("instagram", v)} placeholder="@seunegocio" />
            <Field label="Endereço" value={b.address} onChange={(v) => set("address", v)} />
            <Field className="sm:col-span-2" textarea label="Observações" value={b.extra} onChange={(v) => set("extra", v)} placeholder="Algo mais que a página precisa ter?" />
          </section>
        )}

        {error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

        <div className="flex justify-between border-t border-linha pt-5">
          <button type="button" className="btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Voltar</button>
          {step < STEPS.length - 1 ? (
            <button type="button" className="btn-primary" disabled={!canNext} onClick={() => setStep(step + 1)}>Continuar</button>
          ) : (
            <button type="button" className="btn-primary" disabled={!canNext || pending} onClick={submit}>
              {pending ? "Gerando prompt…" : "Gerar prompt"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Choice(p: { active: boolean; locked?: boolean; lockText?: string; onClick: () => void; title: string; desc: string }) {
  return (
    <button
      type="button"
      disabled={p.locked}
      onClick={p.onClick}
      className={clsx(
        "rounded-2xl border p-4 text-left",
        p.active ? "border-brand-500 bg-brand-600/25 ring-2 ring-brand-600/40" : "border-linha hover:border-brand-300",
        p.locked && "cursor-not-allowed opacity-50",
      )}
    >
      <div className="flex items-center justify-between font-semibold">
        {p.title}
        {p.locked && <span className="flex items-center gap-1 text-xs font-medium text-ink-500"><Lock className="h-3 w-3" /> {p.lockText}</span>}
      </div>
      <p className="muted mt-1">{p.desc}</p>
    </button>
  );
}

function Field(p: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; textarea?: boolean; className?: string }) {
  return (
    <label className={p.className}>
      <span className="label">{p.label}</span>
      {p.textarea ? (
        <textarea className="input min-h-24" value={p.value} placeholder={p.placeholder} onChange={(e) => p.onChange(e.target.value)} />
      ) : (
        <input className="input" value={p.value} placeholder={p.placeholder} onChange={(e) => p.onChange(e.target.value)} />
      )}
    </label>
  );
}

function FilePick(p: { accept: string; multiple?: boolean; files: File[]; onFiles: (f: File[]) => void; onRemove?: (i: number) => void }) {
  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-linha px-4 py-6 text-sm text-ink-500 hover:border-brand-300">
        <ImagePlus className="h-5 w-5" /> Escolher arquivo{p.multiple ? "s" : ""}
        <input type="file" className="hidden" accept={p.accept} multiple={p.multiple} onChange={(e) => p.onFiles(Array.from(e.target.files ?? []))} />
      </label>
      {p.files.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {p.files.map((f, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={URL.createObjectURL(f)} alt={f.name} className="h-20 w-20 rounded-xl border border-linha object-cover" />
              {p.onRemove && (
                <button type="button" onClick={() => p.onRemove!(i)} className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-black text-xs text-white">×</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Aceita "1.200,50", "1200.50" ou "1200".
function parseMoney(v: string): number | null {
  const t = v.replace(/[R$\s]/g, "");
  if (!t) return null;
  const n = Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}
