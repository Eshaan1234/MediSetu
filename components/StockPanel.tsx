"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Activity, ArrowDownRight, ArrowUpRight, Boxes, CircleAlert, Minus, Plus, Search, TrendingDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/app/providers";
import type { Medicine, StockRow, Transaction } from "@/lib/types";
import { inr } from "@/lib/utils";

type Row = StockRow & { medicine: Medicine; pharmacy: { id: string; name: string } };
type Txn = Transaction & { medicine?: Medicine };

export function StockPanel({ pharmacyId, version, onAdjusted }: { pharmacyId: string; version: number; onAdjusted: () => void }) {
  const { t, notify } = useApp();
  const [rows, setRows] = useState<Row[]>([]);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [filter, setFilter] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch(`/api/inventory?pharmacyId=${pharmacyId}`).then((r) => r.json()),
      fetch(`/api/transactions?pharmacyId=${pharmacyId}&limit=9`).then((r) => r.json()),
    ])
      .then(([s, x]) => {
        setRows(s.stock ?? []);
        setTxns(x.transactions ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [pharmacyId, version]);

  const adjust = async (medicineId: string, delta: number) => {
    setBusyId(medicineId + delta);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pharmacyId, medicineId, delta }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify(`${data.row.medicineId} → ${data.row.quantity} units`, "ok");
      onAdjusted();
      load();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Update failed", "warn");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(
    () => rows.filter((r) => `${r.medicine.name} ${r.medicine.salt} ${r.medicine.manufacturer}`.toLowerCase().includes(filter.toLowerCase())),
    [rows, filter],
  );
  const low = rows.filter((r) => r.quantity > 0 && r.quantity <= r.reorderLevel).length;
  const out = rows.filter((r) => r.quantity === 0).length;

  return (
    <div className="space-y-5">
      <div className="glass overflow-hidden rounded-3xl">
        <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.07] px-5 py-4">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-sky/10 text-sky-300"><Boxes className="h-4 w-4" /></span>
          <div>
            <div className="text-sm font-bold text-white">Live stock ledger</div>
            <div className="text-[11px] text-slate-500">{rows.length} SKUs tracked · every AI change is logged</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="badge border border-amber-400/20 bg-amber-400/10 text-amber-300"><CircleAlert className="h-3 w-3" /> {low} {t("lowStock").toLowerCase()}</span>
            <span className="badge border border-rose-400/20 bg-rose-400/10 text-rose-300">{out} out</span>
          </div>
        </div>
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-3">
          <Search className="h-3.5 w-3.5 text-slate-500" />
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter stock by medicine…" className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-600" />
        </div>
        <div className="max-h-[340px] overflow-auto">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer m-3 h-14 rounded-xl" />)
          ) : filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-slate-500">No stock rows here yet.</div>
          ) : (
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead className="sticky top-0 bg-[#0b1424]/95 text-[10px] uppercase tracking-wider text-slate-500 backdrop-blur">
                <tr>
                  <th className="px-5 py-2.5 font-semibold">Medicine</th>
                  <th className="px-3 py-2.5 font-semibold">{t("stock")}</th>
                  <th className="px-3 py-2.5 font-semibold">Price</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Quick edit</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {filtered.slice(0, 40).map((r) => {
                    const pct = Math.min(100, Math.round((r.quantity / Math.max(1, r.reorderLevel * 3)) * 100));
                    const tone = r.quantity === 0 ? "bg-rose-400" : r.quantity <= r.reorderLevel ? "bg-amber-400" : "bg-mint";
                    return (
                      <motion.tr key={r.medicineId + r.pharmacyId} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-white/[0.045] transition hover:bg-white/[0.025]">
                        <td className="px-5 py-2.5">
                          <div className="font-semibold text-slate-200">{r.medicine.name}</div>
                          <div className="text-[10px] text-slate-500">{r.medicine.salt} · {r.medicine.strength}</div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className={`w-8 font-bold ${r.quantity === 0 ? "text-rose-300" : r.quantity <= r.reorderLevel ? "text-amber-300" : "text-white"}`}>{r.quantity}</span>
                            <span className="h-1.5 w-16 overflow-hidden rounded-full bg-white/[0.07]"><span className={`block h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} /></span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-slate-300">{inr(r.price)}</td>
                        <td className="px-5 py-2.5">
                          <div className="flex justify-end gap-1.5">
                            <button onClick={() => adjust(r.medicineId, -1)} disabled={busyId !== null} className="grid h-7 w-7 place-items-center rounded-lg border border-rose-400/20 bg-rose-400/[0.07] text-rose-300 transition hover:bg-rose-400/20 disabled:opacity-40" title={t("remove")}><Minus className="h-3 w-3" /></button>
                            <button onClick={() => adjust(r.medicineId, 10)} disabled={busyId !== null} className="grid h-7 w-7 place-items-center rounded-lg border border-mint/20 bg-mint/[0.07] text-mint transition hover:bg-mint/20 disabled:opacity-40" title={t("add")}><Plus className="h-3 w-3" /></button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="glass rounded-3xl p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-bold text-white"><Activity className="h-4 w-4 text-mint" /> {t("activity")}</div>
        <div className="space-y-2.5">
          {txns.length === 0 && <div className="py-6 text-center text-xs text-slate-500">No activity yet.</div>}
          {txns.map((tx) => (
            <motion.div key={tx.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${tx.delta < 0 ? "bg-rose-400/10 text-rose-300" : "bg-mint/10 text-mint"}`}>
                {tx.delta < 0 ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-slate-200">{tx.medicine?.name ?? tx.medicineId}</span>
                <span className="block truncate text-[10px] text-slate-500">{tx.note || (tx.delta < 0 ? t("sale") : t("purchase"))} · {tx.source === "ai" ? "AI" : tx.source === "manual" ? "manual" : "seed"}</span>
              </span>
              <span className={`text-xs font-bold ${tx.delta < 0 ? "text-rose-300" : "text-mint"}`}>{tx.delta > 0 ? "+" : ""}{tx.delta}</span>
              <span className="hidden w-14 text-right text-[10px] text-slate-600 sm:block">{new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
            </motion.div>
          ))}
        </div>
        {txns.length > 0 && <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-500"><TrendingDown className="h-3 w-3" /> Every deduction is reversible by adding stock back.</div>}
      </div>
    </div>
  );
}
