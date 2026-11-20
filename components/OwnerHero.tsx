"use client";

import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Boxes, ClipboardList, Package, Sparkles, Store, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "@/app/providers";
import type { Pharmacy } from "@/lib/types";

interface Stats { skus: number; units: number; lowStock: number; outOfStock: number; salesToday: number; inventoryValue: number }

export function OwnerHero() {
  const { pharmacyId, setPharmacyId, login, notify } = useApp();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/pharmacies").then((r) => r.json()).then((d) => setPharmacies(d.pharmacies ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`/api/analytics?pharmacyId=${pharmacyId}`).then((r) => r.json()).then(setStats).catch(() => {});
  }, [pharmacyId]);

  const current = pharmacies.find((p) => p.id === pharmacyId);
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const needsAttention = (stats?.lowStock ?? 0) + (stats?.outOfStock ?? 0);

  return (
    <section id="dashboard" className="relative overflow-hidden pb-10 pt-28 sm:pt-32">
      <div className="glow-orb -left-20 top-0 h-72 w-72 bg-sky/20 animate-float" />
      <div className="glow-orb -right-20 top-24 h-72 w-72 bg-mint/20 animate-float [animation-delay:-4s]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }} className="eyebrow">
          <span className="relative flex h-2 w-2"><span className="absolute h-full w-full animate-ping rounded-full bg-mint opacity-70" /><span className="relative h-2 w-2 rounded-full bg-mint" /></span>
          Pharmacy owner workspace
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.08 }} className="glass relative overflow-hidden rounded-[28px] p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-sky/10 blur-3xl" />
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-300"><Store className="h-4 w-4" /> Your store</div>
            <h1 className="mt-4 max-w-lg text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-[40px]">
              Run your pharmacy, <span className="gradient-text">one sentence at a time.</span>
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-slate-400">
              Tell the AI what was sold or received — in any Indian language — and your stock, audit log and dashboards update instantly.
            </p>

            <label className="mt-6 flex max-w-lg items-center gap-3 rounded-xl border border-white/10 bg-[#0a1120]/80 px-3.5 py-2.5">
              <Store className="h-4 w-4 shrink-0 text-mint" />
              <select value={pharmacyId} onChange={(e) => { setPharmacyId(e.target.value); notify("Switched pharmacy", "ok"); }} className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-white outline-none">
                {pharmacies.map((p) => <option key={p.id} value={p.id} className="bg-[#0c1426]">{p.name} · {p.city}</option>)}
              </select>
            </label>

            <div className="mt-6 flex flex-wrap gap-2">
              <button onClick={() => go("inventory")} className="btn-primary"><Sparkles className="h-4 w-4" /> Open AI assistant</button>
              <button onClick={() => go("insights")} className="btn-ghost"><ClipboardList className="h-4 w-4" /> View insights</button>
              <button onClick={() => { login("customer"); go("find"); }} className="btn-ghost">Check a medicine <ArrowRight className="h-3.5 w-3.5" /></button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.16 }} className="glass rounded-[28px] p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">Today at {current?.city ?? "your store"}</div>
                <div className="text-[11px] text-slate-500">Live snapshot · updates with every AI command</div>
              </div>
              <span className="badge border border-mint/25 bg-mint/10 text-mint">LIVE</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Boxes, label: "SKUs", value: stats?.skus ?? "—", tone: "text-sky-300" },
                { icon: Package, label: "Units", value: stats?.units ?? "—", tone: "text-mint" },
                { icon: TrendingUp, label: "Sold today", value: stats?.salesToday ?? "—", tone: "text-lavender" },
                { icon: AlertTriangle, label: "Need stock", value: needsAttention, tone: "text-amber-300" },
              ].map((k) => (
                <div key={k.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                  <k.icon className={`mb-2 h-4 w-4 ${k.tone}`} />
                  <div className="text-2xl font-bold text-white">{k.value}</div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">{k.label}</div>
                </div>
              ))}
            </div>
            {needsAttention > 0 && (
              <button onClick={() => go("inventory")} className="mt-4 flex w-full items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.07] px-3 py-2.5 text-left text-[11px] text-amber-200">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {needsAttention} medicine{needsAttention > 1 ? "s" : ""} need your attention — review low stock
                <ArrowRight className="ml-auto h-3.5 w-3.5" />
              </button>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
