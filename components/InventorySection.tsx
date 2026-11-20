"use client";

import { useEffect, useState } from "react";
import { Store } from "lucide-react";
import type { Pharmacy } from "@/lib/types";
import { InventoryAI } from "./InventoryAI";
import { StockPanel } from "./StockPanel";
import { InsightsPanel } from "./InsightsPanel";
import { useApp } from "@/app/providers";

export function InventorySection() {
  const { t, pharmacyId, setPharmacyId } = useApp();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    fetch("/api/pharmacies")
      .then((r) => r.json())
      .then((d) => {
        const list = (d.pharmacies ?? []) as Pharmacy[];
        setPharmacies(list);
        if (list.length && !list.some((p) => p.id === pharmacyId)) setPharmacyId(list[0].id);
      })
      .catch(() => {});
  }, []);

  const bump = () => setVersion((v) => v + 1);

  return (
    <section id="inventory" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="eyebrow"><SparkleIcon /> AI-powered inventory</div>
          <h2 className="section-title">{t("inventory")} that listens</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Type or say what happened — in English, Hindi or any Indian language. The assistant identifies the medicine, applies the change and keeps a full audit trail.
          </p>
        </div>
        <label className="glass flex items-center gap-3 rounded-xl px-3.5 py-2.5">
          <Store className="h-4 w-4 text-mint" />
          <select value={pharmacyId} onChange={(e) => { setPharmacyId(e.target.value); bump(); }} className="bg-transparent text-xs font-semibold text-white outline-none">
            {pharmacies.map((p) => <option key={p.id} value={p.id} className="bg-[#0c1426]">{p.name}</option>)}
          </select>
        </label>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <InventoryAI pharmacyId={pharmacyId} pharmacies={pharmacies} onApplied={bump} />
        <StockPanel pharmacyId={pharmacyId} version={version} onAdjusted={bump} />
      </div>
      <div id="insights" className="mt-6 scroll-mt-24">
        <InsightsPanel pharmacyId={pharmacyId} version={version} />
      </div>
    </section>
  );
}

function SparkleIcon() {
  return <span className="relative flex h-3.5 w-3.5 items-center justify-center rounded-full bg-mint/20 text-[9px] text-mint">✦</span>;
}
