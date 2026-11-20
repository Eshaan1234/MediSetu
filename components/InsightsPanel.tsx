"use client";

import { motion } from "framer-motion";
import { BarChart3, CircleAlert, IndianRupee, Package, ShoppingCart, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "@/app/providers";
import { inr } from "@/lib/utils";

interface Analytics {
  skus: number;
  units: number;
  lowStock: number;
  outOfStock: number;
  salesToday: number;
  inventoryValue: number;
  trend: Array<{ day: string; sales: number; purchases: number }>;
  movers: Array<{ medicine?: { name: string; salt: string }; count: number }>;
}

export function InsightsPanel({ pharmacyId, version }: { pharmacyId: string; version: number }) {
  const { t } = useApp();
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch(`/api/analytics?pharmacyId=${pharmacyId}`).then((r) => r.json()).then(setData).catch(() => {});
  }, [pharmacyId, version]);

  const max = Math.max(1, ...(data?.trend ?? []).flatMap((d) => [d.sales, d.purchases]));
  const maxMover = Math.max(1, ...(data?.movers ?? []).map((m) => m.count));

  return (
    <div className="glass rounded-3xl p-5 sm:p-7">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow"><span className="h-px w-6 bg-mint" /> A clearer picture</div>
          <h3 className="section-title">{t("analytics")} & forecasting signals</h3>
          <p className="mt-1.5 text-xs text-slate-500">Stock health and movement, recalculated after every AI update.</p>
        </div>
        <span className="badge border border-white/10 bg-white/5 text-slate-400">Last 7 days</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { icon: Package, label: "SKUs tracked", value: data?.skus ?? "—", tone: "text-sky-300" },
          { icon: ShoppingCart, label: t("salesToday"), value: data?.salesToday ?? "—", tone: "text-mint" },
          { icon: CircleAlert, label: "Needs restock", value: data ? data.lowStock + data.outOfStock : "—", tone: "text-amber-300" },
          { icon: IndianRupee, label: "Stock value", value: data ? inr(data.inventoryValue) : "—", tone: "text-lavender" },
          { icon: TrendingUp, label: "Units on hand", value: data?.units ?? "—", tone: "text-mint" },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
            <k.icon className={`mb-3 h-4 w-4 ${k.tone}`} />
            <div className="text-xl font-bold text-white">{k.value}</div>
            <div className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">{k.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-white/[0.06] bg-[#08101d]/60 p-5">
          <div className="mb-5 flex items-center gap-2 text-sm font-bold text-white"><BarChart3 className="h-4 w-4 text-mint" /> Stock movement</div>
          <div className="flex h-44 items-end gap-3">
            {(data?.trend ?? Array.from({ length: 7 }, (_, i) => ({ day: ["M", "T", "W", "T", "F", "S", "S"][i], sales: 0, purchases: 0 }))).map((d, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center gap-2">
                <div className="flex h-full w-full items-end justify-center gap-1">
                  <motion.div initial={{ height: 0 }} animate={{ height: `${(d.sales / max) * 100}%` }} transition={{ duration: 0.7, delay: i * 0.05 }} className="w-2.5 rounded-t bg-gradient-to-t from-rose-500/60 to-rose-300" title={`${d.sales} sold`} />
                  <motion.div initial={{ height: 0 }} animate={{ height: `${(d.purchases / max) * 100}%` }} transition={{ duration: 0.7, delay: i * 0.05 + 0.08 }} className="w-2.5 rounded-t bg-gradient-to-t from-mint/60 to-mint" title={`${d.purchases} received`} />
                </div>
                <span className="text-[10px] text-slate-500">{d.day}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-4 text-[10px] text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-rose-300" /> {t("sale")}</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-mint" /> {t("purchase")}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-[#08101d]/60 p-5">
          <div className="mb-5 flex items-center gap-2 text-sm font-bold text-white"><TrendingUp className="h-4 w-4 text-sky-300" /> Fast movers</div>
          <div className="space-y-3.5">
            {(data?.movers ?? []).slice(0, 5).map((m, i) => (
              <div key={i}>
                <div className="mb-1.5 flex justify-between text-[11px]">
                  <span className="truncate pr-2 text-slate-300">{m.medicine?.name ?? "—"}</span>
                  <span className="font-semibold text-white">{m.count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(m.count / maxMover) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.07 }} className="h-full rounded-full bg-gradient-to-r from-sky-500 to-mint" />
                </div>
              </div>
            ))}
            {!data?.movers?.length && <div className="py-8 text-center text-xs text-slate-500">No sales recorded yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
