"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { CreditCard, Globe, LayoutDashboard, LogOut, Menu, Rocket, Settings, Sparkles, User, X } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/criar", label: "Criar página", icon: Sparkles },
  { href: "/paginas", label: "Páginas publicadas", icon: Rocket },
  { href: "/dominios", label: "Domínios", icon: Globe },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
  { href: "/perfil", label: "Perfil", icon: User },
  { href: "/assinatura", label: "Assinatura", icon: CreditCard },
];

export function Sidebar({ userName, planLabel, logout }: { userName: string; planLabel: string; logout: () => Promise<void> }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between bg-ink-900 px-4 py-3 text-white lg:hidden">
        <span className="font-display font-black uppercase [font-stretch:125%]">Lift<span className="text-brand-300">Page</span></span>
        <button aria-label="Abrir menu" onClick={() => setOpen(true)}><Menu className="h-6 w-6" /></button>
      </header>
      {open && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-ink-900 text-white transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Link href="/dashboard" className="flex items-center gap-2 font-display text-base font-black uppercase [font-stretch:125%]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-simbolo.svg" alt="" className="h-8 w-8" />
            <span>Lift<span className="text-brand-300">Page</span></span>
          </Link>
          <button className="lg:hidden" aria-label="Fechar menu" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = path === href || path.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                  active ? "bg-brand-700 text-brand-300" : "text-white/60 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="h-[18px] w-[18px]" /> {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 text-sm">
            <div className="font-semibold">{userName}</div>
            <Link href="/assinatura" className="text-xs font-semibold text-brand-300">Plano {planLabel}</Link>
          </div>
          <form action={logout}>
            <button className="flex items-center gap-2 text-sm text-white/60 hover:text-white"><LogOut className="h-4 w-4" /> Sair</button>
          </form>
        </div>
      </aside>
    </>
  );
}
