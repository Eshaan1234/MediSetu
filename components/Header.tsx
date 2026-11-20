"use client";

import { motion } from "framer-motion";
import { Activity, ChevronDown, Globe2, Heart, Languages, LogOut, Menu, Sparkles, Store, UserRound, X } from "lucide-react";
import { useState } from "react";
import { signOut as nextSignOut, useSession } from "next-auth/react";
import { useApp } from "@/app/providers";
import { LANGUAGES } from "@/lib/i18n";
import type { LanguageCode } from "@/lib/types";

export function Header({ status }: { status: { ai?: string; maps?: string; storage?: string } | null }) {
  const { t, lang, setLang, language, role, login, signOut, savedIds } = useApp();
  const { data: session } = useSession();
  const [active, setActive] = useState<"lang" | "account" | null>(null);
  const [menu, setMenu] = useState(false);

  const customerNav = [
    { id: "find", key: "find" as const },
    { id: "saved", key: "saved" as const },
    { id: "map", key: "nearby" as const },
  ];
  const ownerNav = [
    { id: "dashboard", key: "dashboard" as const },
    { id: "inventory", key: "inventory" as const },
    { id: "insights", key: "analytics" as const },
  ];
  const isOwner = role === "owner";
  const nav = isOwner ? ownerNav : customerNav;

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMenu(false);
    setActive(null);
  };
  const toggle = (which: "lang" | "account") => {
    setActive((cur) => (cur === which ? null : which));
    setMenu(false);
  };
  const doSignOut = async () => {
    try { await nextSignOut({ redirect: false }); } catch { /* local sign-out still applies */ }
    signOut();
    setActive(null);
  };

  return (
    <motion.header initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.07] bg-[#050914]/90 backdrop-blur-2xl">
      {active && <div className="fixed inset-0 z-20" onClick={() => setActive(null)} />}

      <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-3 px-4 sm:px-6">
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex shrink-0 items-center gap-2.5">
          <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-mint to-sky shadow-[0_0_24px_-6px_rgba(52,226,176,.9)]">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#05120e]" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 4v16M4 12h16" strokeLinecap="round" /></svg>
          </span>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-[17px] font-extrabold tracking-tight text-white">Medi<span className="text-mint">Setu</span></span>
            <span className="block text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">India&apos;s medicine finder</span>
          </span>
        </button>

        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <button key={item.id} onClick={() => go(item.id)} className="rounded-lg px-3 py-2 text-[13px] font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-white">{t(item.key)}</button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {!isOwner && (
            <button onClick={() => go("saved")} className="btn-ghost relative hidden !px-2.5 !py-2 sm:inline-flex" title={t("saved")}>
              <Heart className="h-4 w-4 text-rose-300" />
              {savedIds.length > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-400 px-1 text-[9px] font-bold text-white">{savedIds.length}</span>}
            </button>
          )}

          <div className="relative hidden lg:block">
            <button onClick={() => toggle("account")} className="btn-ghost !px-3 !py-2">
              {isOwner ? <Store className="h-4 w-4 text-sky-300" /> : <UserRound className="h-4 w-4 text-mint" />}
              <span className="text-xs">{isOwner ? t("owner") : t("customer")}</span>
              <ChevronDown className={`h-3.5 w-3.5 transition ${active === "account" ? "rotate-180" : ""}`} />
            </button>
            {active === "account" && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="dropdown-panel">
                {session?.user && <div className="mb-2 truncate rounded-xl bg-white/[0.05] px-3 py-2 text-[10px] text-slate-300">{session.user.email ?? session.user.name}</div>}
                <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">{t("switchRole")}</div>
                <button onClick={() => { login("customer"); go("find"); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs text-slate-200 hover:bg-white/[0.07]">
                  <UserRound className="h-3.5 w-3.5 text-mint" /> {t("customer")}
                </button>
                <button onClick={() => { login("owner"); go("dashboard"); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs text-slate-200 hover:bg-white/[0.07]">
                  <Store className="h-3.5 w-3.5 text-sky-300" /> {t("owner")}
                </button>
                <button onClick={() => void doSignOut()} className="mt-1 flex w-full items-center gap-2 border-t border-white/[0.08] px-3 py-2.5 text-left text-xs text-rose-300 hover:bg-rose-400/[0.07]">
                  <LogOut className="h-3.5 w-3.5" /> {t("signout")}
                </button>
              </motion.div>
            )}
          </div>

          <span className="hidden items-center gap-1.5 rounded-full border border-mint/20 bg-mint/[0.07] px-3 py-1.5 text-[11px] font-semibold text-mint 2xl:inline-flex">
            <Activity className="h-3.5 w-3.5" /> {status?.ai === "openai" ? "AI + Local" : "Local AI"}
          </span>

          <div className="relative hidden sm:block">
            <button onClick={() => toggle("lang")} className="btn-ghost !px-3 !py-2" aria-label={t("language")}>
              <Globe2 className="h-4 w-4 text-mint" />
              <span className="hidden max-w-[92px] truncate md:inline">{language.native}</span>
              <ChevronDown className={`h-3.5 w-3.5 transition ${active === "lang" ? "rotate-180" : ""}`} />
            </button>
            {active === "lang" && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="dropdown-panel max-h-[62vh] overflow-y-auto">
                <div className="sticky top-0 mb-1 flex items-center gap-2 bg-[#0e192c] px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  <Languages className="h-3.5 w-3.5 text-mint" /> {t("language")} · detected: {language.native}
                </div>
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code as LanguageCode); setActive(null); }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] transition ${l.code === lang ? "bg-mint/20 text-mint" : "text-slate-200 hover:bg-white/[0.07]"}`}
                  >
                    <span className="flex items-center gap-2"><span className="w-5 text-center">{l.native.slice(0, 2)}</span><span>{l.native}</span></span>
                    <span className="text-[10px] text-slate-500">{l.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          <button onClick={() => go(isOwner ? "inventory" : "find")} className="btn-primary hidden !px-4 !py-2 lg:inline-flex">
            {isOwner ? <><Sparkles className="h-4 w-4" /> AI Stock</> : "Find medicines"}
          </button>
          <button onClick={() => { setMenu((v) => !v); setActive(null); }} className="btn-ghost !px-2.5 !py-2 lg:hidden" aria-label="Menu">
            {menu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {menu && (
        <motion.nav initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="max-h-[70vh] overflow-y-auto border-t border-white/[0.07] bg-[#080e1c] px-4 py-3 lg:hidden">
          {nav.map((item) => (
            <button key={item.id} onClick={() => go(item.id)} className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-200 hover:bg-white/5">{t(item.key)}</button>
          ))}
          <div className="my-2 h-px bg-white/[0.07]" />
          <button onClick={() => { login(isOwner ? "customer" : "owner"); setMenu(false); }} className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-mint">
            Switch to {isOwner ? t("customer") : t("owner")}
          </button>
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400">
            <Globe2 className="h-3.5 w-3.5 text-mint" />
            <select value={lang} onChange={(e) => setLang(e.target.value as LanguageCode)} className="max-w-[210px] bg-transparent text-xs text-slate-200 outline-none">
              {LANGUAGES.map((l) => <option key={l.code} value={l.code} className="bg-[#0c1426]">{l.native}</option>)}
            </select>
          </div>
          <button onClick={() => void doSignOut()} className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-rose-300">{t("signout")}</button>
        </motion.nav>
      )}
    </motion.header>
  );
}
