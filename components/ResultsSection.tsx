"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, BadgeCheck, Building2, ChevronRight, CircleAlert, ExternalLink, Heart, MapPin, PackageCheck, RefreshCw, SearchX, Sparkles, Store } from "lucide-react";
import type { ExternalListing, SourceStatus } from "@/lib/types";
import type { MedicineHit } from "@/lib/store";
import { useApp } from "@/app/providers";
import { inr } from "@/lib/utils";

export function ResultsSection({
  query,
  medicines,
  listings,
  sources,
  loading,
  onSelect,
  onSync,
  syncing,
}: {
  query: string;
  medicines: MedicineHit[];
  listings: ExternalListing[];
  sources: SourceStatus[];
  loading: boolean;
  onSelect: (id: string) => void;
  onSync: () => void;
  syncing: boolean;
}) {
  const { t, toggleSaved, isSaved } = useApp();

  return (
    <section id="find" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-14 pt-0 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        {query ? (
          <div>
            <div className="eyebrow !mb-1"><span className="h-px w-6 bg-mint" /> Search & compare</div>
            <h2 className="text-xl font-bold text-white sm:text-2xl">{t("results")} — “{query}”</h2>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-mint" />
            <h2 className="text-sm font-bold text-white">Suggested medicines</h2>
            <span className="hidden text-[11px] text-slate-500 sm:inline">tap a heart to save, tap the map to find a store</span>
          </div>
        )}
        <button onClick={onSync} disabled={syncing} className="btn-ghost !py-2 !text-xs disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} /> {syncing ? "Checking…" : "Live prices"}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_310px]">
        <div>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass shimmer h-52 rounded-2xl" />
              ))}
            </div>
          ) : medicines.length === 0 ? (
            <div className="glass grid place-items-center rounded-2xl px-6 py-16 text-center">
              <SearchX className="mb-4 h-10 w-10 text-slate-600" />
              <h3 className="text-lg font-semibold text-white">{t("noResults")}</h3>
              <p className="mt-2 max-w-sm text-sm text-slate-500">Try a brand like “Dolo 650”, a salt like “paracetamol”, or search in your own language.</p>
            </div>
          ) : (
            <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {medicines.slice(0, 12).map((m, i) => (
                  <motion.article
                    key={m.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.35, delay: Math.min(i, 8) * 0.035 }}
                    whileHover={{ y: -5 }}
                    className="glass card-hover relative flex min-h-[212px] flex-col overflow-hidden rounded-2xl p-5"
                  >
                    <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-mint/10 blur-2xl" />
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[16px] font-bold text-white">{m.name}</h3>
                          {m.prescription && <span className="badge border border-rose-400/25 bg-rose-400/10 text-rose-300">{t("rx")} Rx</span>}
                        </div>
                        <p className="mt-1 text-xs text-slate-400">{m.salt} · {m.strength} · {m.form}</p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => toggleSaved(m.id)}
                          title={isSaved(m.id) ? "Remove from my list" : "Save to my list"}
                          className={`grid h-9 w-9 place-items-center rounded-xl border transition ${isSaved(m.id) ? "border-rose-400/40 bg-rose-400/15 text-rose-300" : "border-white/10 bg-white/[0.04] text-slate-500 hover:border-rose-400/40 hover:text-rose-300"}`}
                        >
                          <Heart className={`h-4 w-4 ${isSaved(m.id) ? "fill-current" : ""}`} />
                        </button>
                        <span className="grid h-9 w-9 place-items-center rounded-xl border border-mint/20 bg-mint/10 text-mint"><PackageCheck className="h-4 w-4" /></span>
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-1.5 text-[10px] text-slate-400">
                      <span className="rounded-md bg-white/[0.05] px-2 py-1">{m.manufacturer}</span>
                      <span className="rounded-md bg-white/[0.05] px-2 py-1">{m.category}</span>
                    </div>

                    <div className="mt-auto flex items-end justify-between pt-5">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500">Price range</div>
                        <div className="mt-0.5 text-xl font-bold text-white">
                          {inr(m.minPrice)}<span className="text-xs font-normal text-slate-500"> – {inr(m.maxPrice)}</span>
                        </div>
                        <div className={`mt-1 flex items-center gap-1 text-[11px] ${m.inStockCount ? "text-mint" : "text-rose-300"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${m.inStockCount ? "bg-mint" : "bg-rose-400"}`} />
                          {m.inStockCount ? `${m.inStockCount} ${t("inStock").toLowerCase()}` : t("outOfStock")} · {m.pharmacyCount} {t("pharmacies")}
                        </div>
                      </div>
                      <button onClick={() => onSelect(m.id)} className="btn-ghost !px-3 !py-2 !text-xs">
                        {t("viewMap")} <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="glass rounded-2xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-white"><RadioDot /> {t("livePrices")}</div>
              <span className="badge border border-white/10 bg-white/5 text-[10px] text-slate-400">best effort</span>
            </div>
            {listings.length ? (
              <div className="space-y-3">
                {listings.slice(0, 7).map((l, i) => (
                  <a key={`${l.source}-${i}`} href={l.url} target="_blank" rel="noreferrer noopener" className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 transition hover:border-mint/30">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sky/10 text-sky-300"><Store className="h-3.5 w-3.5" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-slate-200 group-hover:text-white">{l.name}</span>
                      <span className="block truncate text-[10px] text-slate-500">{l.source} · {l.pack || "Online"}</span>
                    </span>
                    <span className="text-right">
                      <span className="block text-sm font-bold text-mint">{inr(l.price)}</span>
                      <ExternalLink className="ml-auto h-3 w-3 text-slate-600 group-hover:text-mint" />
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-center">
                <Building2 className="mx-auto mb-2 h-6 w-6 text-slate-600" />
                <p className="text-xs leading-5 text-slate-500">No live listings parsed yet. Pharmacy sites block automated access; cached or curated prices are shown instead.</p>
                <button onClick={onSync} disabled={syncing} className="mt-3 text-xs font-semibold text-mint hover:underline">Try sync now →</button>
              </div>
            )}
          </div>

          {sources.some((s) => s.ok && s.count > 0) && (
            <div className="glass rounded-2xl p-5">
              <div className="mb-3 text-sm font-bold text-white">Responding sources</div>
              <div className="space-y-2">
                {sources.filter((s) => s.ok && s.count > 0).map((s) => (
                  <div key={s.id} className="flex items-center gap-2.5 text-xs">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-mint shadow-[0_0_8px_#34e2b0]" />
                    <span className="flex-1 text-slate-300">{s.name}</span>
                    <span className="text-[10px] text-slate-500">{s.count} found</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass rounded-2xl border-mint/15 bg-mint/[0.04] p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-white"><Sparkles className="h-4 w-4 text-mint" /> Salt alternatives</div>
            <p className="mt-2 text-xs leading-5 text-slate-400">Every medicine card links to the same salt from other brands so you can compare costs safely with your pharmacist.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function RadioDot() {
  return <span className="relative flex h-2 w-2"><span className="absolute h-full w-full animate-ping rounded-full bg-mint opacity-70" /><span className="relative h-2 w-2 rounded-full bg-mint" /></span>;
}
