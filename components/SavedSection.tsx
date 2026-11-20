"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Heart, MapPin, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "@/app/providers";
import type { MedicineHit } from "@/lib/store";
import { inr } from "@/lib/utils";

export function SavedSection({ onSelectMedicine }: { onSelectMedicine: (id: string) => void }) {
  const { savedIds, toggleSaved, t } = useApp();
  const [all, setAll] = useState<MedicineHit[]>([]);

  useEffect(() => {
    fetch("/api/medicines?q=&live=0")
      .then((r) => r.json())
      .then((d) => setAll(d.medicines ?? []))
      .catch(() => {});
  }, []);

  const items = all.filter((m) => savedIds.includes(m.id));

  return (
    <section id="saved" className="scroll-mt-24 px-4 pb-10 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="glass overflow-hidden rounded-3xl p-5 sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="eyebrow"><Heart className="h-3 w-3 text-rose-300" /> Just for you</div>
              <h2 className="section-title">{t("saved")} <span className="text-slate-500">({items.length})</span></h2>
              <p className="mt-1.5 text-xs text-slate-500">Your personal shortlist — saved on this device for next time.</p>
            </div>
            {items.length > 0 && (
              <button onClick={() => document.getElementById("find")?.scrollIntoView({ behavior: "smooth" })} className="btn-ghost !py-2.5 !text-xs">
                Add more <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-6 py-10 text-center">
              <Heart className="mb-3 h-8 w-8 text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">No saved medicines yet</p>
              <p className="mt-1 max-w-sm text-xs text-slate-500">Tap the heart on any medicine to keep it here — handy when you&apos;re at the pharmacy.</p>
              <button onClick={() => document.getElementById("find")?.scrollIntoView({ behavior: "smooth" })} className="btn-ghost mt-4 !py-2 !text-xs">Browse medicines</button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {items.map((m) => (
                  <motion.div key={m.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-400/10 text-rose-300"><Heart className="h-4 w-4 fill-current" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-white">{m.name}</div>
                      <div className="truncate text-[11px] text-slate-500">{m.salt} · {inr(m.minPrice)}–{inr(m.maxPrice)}</div>
                      <div className={`mt-0.5 text-[10px] ${m.inStockCount ? "text-mint" : "text-rose-300"}`}>{m.inStockCount ? `${m.inStockCount} pharmacies have it` : "Currently out of stock"}</div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1.5">
                      <button onClick={() => onSelectMedicine(m.id)} className="btn-ghost !px-2.5 !py-1.5 !text-[10px]"><MapPin className="h-3 w-3" /> Find</button>
                      <button onClick={() => toggleSaved(m.id)} className="flex items-center justify-center gap-1 text-[10px] text-slate-500 hover:text-rose-300"><Trash2 className="h-3 w-3" /> Remove</button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
