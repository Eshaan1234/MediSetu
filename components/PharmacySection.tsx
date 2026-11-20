"use client";

import { motion } from "framer-motion";
import { Clock, Crosshair, MapPin, Navigation, Phone, SlidersHorizontal, Star, Store, Truck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useApp } from "@/app/providers";
import type { MedicineHit } from "@/lib/store";
import type { PharmacyHit } from "@/lib/store";
import { MapPanel } from "./MapPanel";
import { inr } from "@/lib/utils";

const keyOf = (p: PharmacyHit) =>
  `${p.name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20)}:${Math.round(p.lat * 100)}:${Math.round(p.lng * 100)}`;

export const CITY_CENTERS: Record<string, [number, number]> = {
  Pune: [18.5204, 73.8567], Mumbai: [19.076, 72.8777], "New Delhi": [28.6139, 77.209],
  Bengaluru: [12.9716, 77.5946], Chennai: [13.0827, 80.2707], Hyderabad: [17.385, 78.4867],
  Kolkata: [22.5726, 88.3639], Ahmedabad: [23.0225, 72.5714], Jaipur: [26.9124, 75.7873],
  Lucknow: [26.8467, 80.9462], Kochi: [9.9312, 76.2673], Chandigarh: [30.7333, 76.7794],
  Indore: [22.7196, 75.8577], Nagpur: [21.1458, 79.0882], Guwahati: [26.1445, 91.7362],
  Patna: [25.5941, 85.1376], Bhubaneswar: [20.9517, 85.0985],
};

export function PharmacySection({
  medicine,
  city,
  setCity,
  userLocation,
  onLocate,
  mapsMode,
  placesEnabled,
}: {
  medicine: MedicineHit | null;
  city: string;
  setCity: (c: string) => void;
  userLocation: { lat: number; lng: number } | null;
  onLocate: () => void;
  mapsMode: "google" | "openstreetmap";
  placesEnabled: boolean;
}) {
  const { t } = useApp();
  const [items, setItems] = useState<PharmacyHit[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [deliveryOnly, setDeliveryOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [osmItems, setOsmItems] = useState<PharmacyHit[]>([]);
  const [useOsm, setUseOsm] = useState(true);
  const [osmLoading, setOsmLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const p = new URLSearchParams();
    if (city) p.set("city", city);
    if (medicine) p.set("medicineId", medicine.id);
    if (userLocation) { p.set("lat", String(userLocation.lat)); p.set("lng", String(userLocation.lng)); }
    if (inStockOnly && medicine) p.set("inStockOnly", "true");
    fetch(`/api/pharmacies?${p}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const list = (d.pharmacies ?? []) as PharmacyHit[];
        setItems(deliveryOnly ? list.filter((x) => x.delivery) : list);
        setSelected((prev) => (prev && list.some((x) => x.id === prev) ? prev : list[0]?.id ?? null));
        setLoading(false);
      })
      .catch(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [city, medicine?.id, userLocation?.lat, userLocation?.lng, inStockOnly, deliveryOnly]);

  const queryCenter = useMemo<[number, number]>(
    () => (userLocation ? [userLocation.lat, userLocation.lng] : CITY_CENTERS[city] ?? [18.5204, 73.8567]),
    [userLocation, city],
  );

  useEffect(() => {
    if (!useOsm) { setOsmItems([]); return; }
    let alive = true;
    setOsmLoading(true);
    const source = placesEnabled ? "places" : "osm";
    fetch(`/api/pharmacies/${source}?lat=${queryCenter[0]}&lng=${queryCenter[1]}&radius=7000`)
      .then((r) => r.json())
      .then((d) => { if (alive) setOsmItems((d.pharmacies ?? []) as PharmacyHit[]); })
      .catch(() => { if (alive) setOsmItems([]); })
      .finally(() => { if (alive) setOsmLoading(false); });
    return () => { alive = false; };
  }, [queryCenter[0], queryCenter[1], useOsm, placesEnabled]);

  const visible = useMemo(() => {
    const seen = new Set(items.map(keyOf));
    const merged = [...items];
    osmItems.forEach((p) => {
      const k = keyOf(p);
      if (seen.has(k)) return;
      seen.add(k);
      merged.push(p);
    });
    return merged.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0) || b.rating - a.rating);
  }, [items, osmItems]);

  useEffect(() => {
    if (!visible.some((p) => p.id === selected)) setSelected(visible[0]?.id ?? null);
  }, [visible, selected]);

  const center = useMemo<[number, number]>(() => {
    if (userLocation) return [userLocation.lat, userLocation.lng];
    const sel = visible.find((p) => p.id === selected);
    if (sel) return [sel.lat, sel.lng];
    return queryCenter;
  }, [userLocation, visible, selected, queryCenter]);

  const scrollToResults = useCallback(() => document.getElementById("find")?.scrollIntoView({ behavior: "smooth" }), []);

  return (
    <section id="map" className="scroll-mt-24 border-y border-white/[0.05] bg-white/[0.012] py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow"><span className="h-px w-6 bg-mint" /> Find it nearby</div>
            <h2 className="section-title">{t("nearby")}</h2>
            <p className="mt-2 text-sm text-slate-500">Stock and prices at physical pharmacies, plus community-mapped medical shops from OpenStreetMap — tap a pin for details.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="input !w-auto !py-2.5 text-xs"
              aria-label={t("city")}
            >
              <option value="">All India</option>
              {Object.keys(CITY_CENTERS).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={onLocate} className="btn-ghost !py-2.5 !text-xs"><Crosshair className="h-3.5 w-3.5" /> {t("useLocation")}</button>
          </div>
        </div>

        {medicine && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass mb-5 flex flex-wrap items-center gap-3 rounded-2xl border-mint/25 bg-mint/[0.055] px-4 py-3">
            <Store className="h-4 w-4 text-mint" />
            <span className="text-sm text-slate-300">Showing stock for <strong className="text-white">{medicine.name}</strong></span>
            <span className="badge border border-mint/20 bg-mint/10 text-mint">{medicine.inStockCount} {t("inStock").toLowerCase()}</span>
            <button onClick={() => { setCity(""); setInStockOnly(false); scrollToResults(); }} className="ml-auto text-xs font-semibold text-mint hover:underline">clear</button>
          </motion.div>
        )}

        <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <div className="glass flex max-h-[620px] flex-col overflow-hidden rounded-2xl">
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
              <SlidersHorizontal className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-300">{visible.length} {t("pharmacies")}{osmLoading ? " …" : ""}</span>
              <div className="ml-auto flex gap-1.5 overflow-x-auto">
                <button onClick={() => setUseOsm((v) => !v)} className={`chip !px-2 !py-1 !text-[10px] ${useOsm ? "!border-sky/50 !text-sky-200" : ""}`} title={placesEnabled ? "Show real pharmacies from Google Places" : "Show community-mapped pharmacies from OpenStreetMap"}>{placesEnabled ? "Google" : "OSM"}</button>
                <button onClick={() => setInStockOnly((v) => !v)} disabled={!medicine} className={`chip !px-2 !py-1 !text-[10px] ${inStockOnly ? "!border-mint/50 !text-mint" : ""} disabled:opacity-40`}>{t("inStockOnly")}</button>
                <button onClick={() => setDeliveryOnly((v) => !v)} className={`chip !px-2 !py-1 !text-[10px] ${deliveryOnly ? "!border-mint/50 !text-mint" : ""}`}>Delivery</button>
              </div>
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
              {loading && Array.from({ length: 4 }).map((_, i) => <div key={i} className="shimmer h-24 rounded-xl" />)}
              {!loading && !osmLoading && visible.length === 0 && (
                <div className="grid place-items-center px-4 py-14 text-center text-sm text-slate-500">No pharmacies match these filters.</div>
              )}
              {visible.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className={`w-full rounded-xl border p-3.5 text-left transition-all ${
                    selected === p.id ? "border-mint/45 bg-mint/[0.08] shadow-[0_0_0_1px_rgba(52,226,176,.12)]" : "border-white/[0.06] bg-white/[0.025] hover:border-white/15"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${selected === p.id ? "bg-mint/20 text-mint" : "bg-white/5 text-slate-400"}`}><Store className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[13px] font-bold text-white">{p.name}</span>
                        {p.id.startsWith("osm-") && <span className="badge shrink-0 border border-sky/25 bg-sky/10 !px-1.5 !py-0.5 !text-[9px] text-sky-200">OSM</span>}
                        {p.id.startsWith("gplaces-") && <span className="badge shrink-0 border border-sky/25 bg-sky/10 !px-1.5 !py-0.5 !text-[9px] text-sky-200">Google</span>}
                        {p.rating > 0 && <span className="flex shrink-0 items-center gap-0.5 text-[10px] text-amber-300"><Star className="h-2.5 w-2.5 fill-current" />{p.rating}</span>}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-slate-500"><MapPin className="h-3 w-3 shrink-0" />{p.address}</span>
                      <span className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                        {p.distanceKm != null && <span className="rounded bg-sky/10 px-1.5 py-0.5 text-sky-200">{p.distanceKm} km {t("distance").toLowerCase()}</span>}
                        {p.delivery && <span className="flex items-center gap-1 rounded bg-white/5 px-1.5 py-0.5"><Truck className="h-2.5 w-2.5" /> Delivery</span>}
                        <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{p.hours}</span>
                      </span>
                      {p.stock && (
                        <span className="mt-2 flex items-center gap-2 rounded-lg bg-black/20 px-2 py-1.5 text-[11px]">
                          <span className={p.stock.quantity > 0 ? "text-mint" : "text-rose-300"}>{p.stock.quantity > 0 ? `${p.stock.quantity} ${p.stock.unit}s ${t("inStock").toLowerCase()}` : t("outOfStock")}</span>
                          <span className="ml-auto font-bold text-white">{inr(p.price ?? p.stock.price)}</span>
                        </span>
                      )}
                      <span className="mt-2 flex gap-3 text-[11px] text-slate-500">
                        {p.phone && <a href={`tel:${p.phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 hover:text-mint"><Phone className="h-3 w-3" /> Call</a>}
                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 hover:text-mint"><Navigation className="h-3 w-3" /> {t("directions")}</a>
                      </span>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="glass relative h-[460px] overflow-hidden rounded-2xl p-1.5 lg:h-[620px]">
            <MapPanel pharmacies={visible} selectedId={selected} onSelect={setSelected} center={center} mode={mapsMode} />
            <div className="pointer-events-none absolute bottom-5 left-5 z-[400] rounded-lg border border-white/10 bg-[#08101e]/85 px-3 py-2 text-[10px] font-medium text-slate-400 backdrop-blur">
              {mapsMode === "google" ? "Google Maps" : "OpenStreetMap · add a Google key for Google Maps"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
