"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useApp } from "./providers";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ResultsSection } from "@/components/ResultsSection";
import { PharmacySection } from "@/components/PharmacySection";
import { InventorySection } from "@/components/InventorySection";
import { AuthModal } from "@/components/AuthModal";
import { SavedSection } from "@/components/SavedSection";
import { OwnerHero } from "@/components/OwnerHero";
import type { MedicineHit } from "@/lib/store";
import type { ExternalListing, SourceStatus } from "@/lib/types";

interface Status {
  maps: "google" | "openstreetmap";
  places?: boolean;
  ai: string;
  storage: string;
  scraping: string;
  medicines: number;
  pharmacies: number;
  liveListings: number;
}

export default function Home() {
  const { t, toast, notify, role, login, signOut } = useApp();
  const [status, setStatus] = useState<Status | null>(null);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [medicines, setMedicines] = useState<MedicineHit[]>([]);
  const [listings, setListings] = useState<ExternalListing[]>([]);
  const [sources, setSources] = useState<SourceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedicineId, setSelectedMedicineId] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetch("/api/status").then((r) => r.json()).then(setStatus).catch(() => {});
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query.trim()), 320);
    return () => window.clearTimeout(id);
  }, [query]);

  const search = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch(`/api/medicines?q=${encodeURIComponent(debounced)}`);
      const data = await res.json();
      setMedicines(data.medicines ?? []);
      setListings(data.liveListings ?? []);
      setSources(data.sources ?? []);
    } catch {
      notify("Search service is temporarily unavailable", "warn");
    } finally {
      setLoading(false);
    }
  }, [debounced, notify]);

  useEffect(() => { search(); }, [search]);

  const selectedMedicine = useMemo(
    () => medicines.find((m) => m.id === selectedMedicineId) ?? null,
    [medicines, selectedMedicineId],
  );

  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const selectMedicine = (id: string) => {
    setSelectedMedicineId(id);
    const m = medicines.find((x) => x.id === id);
    if (m) setQuery(m.name);
    window.setTimeout(() => document.getElementById("map")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  const locate = () => {
    if (!navigator.geolocation) { notify("Location is not supported in this browser", "warn"); return; }
    notify("Locating you…", "info");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setCity(""); notify("Showing pharmacies near you", "ok"); },
      () => notify("Location denied — pick a city instead", "warn"),
      { enableHighAccuracy: true, timeout: 9000 },
    );
  };

  const sync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      setSources(data.statuses ?? []);
      setListings(data.listings ?? []);
      await search(false);
      const ok = (data.statuses ?? []).filter((s: SourceStatus) => s.ok).length;
      notify(data.total ? `${data.total} live listings found from ${ok} sources` : `Sources checked: ${ok} reachable. Curated prices remain available.`, ok ? "ok" : "info");
    } catch {
      notify("Live source check failed — try again later", "warn");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
      <Header status={status} />
      <AuthModal />
      {role === null ? (
        <main className="min-h-screen" />
      ) : role === "owner" ? (
        <main>
          <OwnerHero />
          <InventorySection />
        </main>
      ) : (
        <main>
          <Hero query={query} setQuery={setQuery} onSearch={(q) => setDebounced(q.trim())} onLocate={locate} status={status} />
          <ResultsSection
            query={debounced}
            medicines={medicines}
            listings={listings}
            sources={sources}
            loading={loading}
            onSelect={selectMedicine}
            onSync={sync}
            syncing={syncing}
          />
          <SavedSection onSelectMedicine={selectMedicine} />
          <PharmacySection
            medicine={selectedMedicine}
            city={city}
            setCity={setCity}
            userLocation={userLocation}
            onLocate={locate}
            mapsMode={status?.maps === "google" ? "google" : "openstreetmap"}
            placesEnabled={Boolean(status?.places)}
          />
        </main>
      )}

      <footer className="border-t border-white/[0.06] bg-[#040811] px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-start justify-between gap-8">
          <div className="max-w-xl">
            <div className="text-lg font-extrabold text-white">Medi<span className="text-mint">Setu</span></div>
            <p className="mt-3 text-xs leading-6 text-slate-500">{t("disclaimer")}</p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-xs sm:grid-cols-3">
            <div>
              <div className="mb-3 font-semibold text-slate-300">Explore</div>
              <div className="space-y-1">
                {[
                  { label: "Find medicines", id: "find" },
                  { label: "My saved list", id: "saved" },
                  { label: "Pharmacy map", id: "map" },
                ].map((l) => <button key={l.id} onClick={() => jump(l.id)} className="block text-left text-slate-500 hover:text-mint">{l.label}</button>)}
              </div>
            </div>
            <div>
              <div className="mb-3 font-semibold text-slate-300">For pharmacies</div>
              <div className="space-y-1">
                <button onClick={() => { login("owner"); window.setTimeout(() => jump("dashboard"), 90); }} className="block text-left text-slate-500 hover:text-mint">Owner dashboard</button>
                <button onClick={() => { login("owner"); window.setTimeout(() => jump("inventory"), 90); }} className="block text-left text-slate-500 hover:text-mint">AI stock assistant</button>
                <button onClick={() => { login("owner"); window.setTimeout(() => jump("insights"), 90); }} className="block text-left text-slate-500 hover:text-mint">Sales insights</button>
              </div>
            </div>
            <div>
              <div className="mb-3 font-semibold text-slate-300">Account</div>
              <div className="space-y-1">
                <button onClick={() => { login("customer"); window.setTimeout(() => jump("find"), 90); }} className="block text-left text-slate-500 hover:text-mint">Customer mode</button>
                <button onClick={() => { login("owner"); window.setTimeout(() => jump("dashboard"), 90); }} className="block text-left text-slate-500 hover:text-mint">Pharmacy owner mode</button>
                <button onClick={() => { signOut(); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="block text-left text-rose-400/80 hover:text-rose-300">Sign out</button>
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-7xl border-t border-white/[0.05] pt-5 text-[11px] text-slate-600">
          Built for India · Data shown is indicative · Emergency? Call 112 or visit a nearby hospital.
        </div>
      </footer>

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="glass fixed bottom-4 left-4 right-4 z-[1000] flex items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl sm:bottom-5 sm:left-auto sm:right-5 sm:max-w-sm"
          >
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${toast.tone === "ok" ? "bg-mint/15 text-mint" : toast.tone === "warn" ? "bg-amber-400/15 text-amber-300" : "bg-sky/15 text-sky-300"}`}>
              {toast.tone === "ok" ? <CheckCircle2 className="h-4 w-4" /> : toast.tone === "warn" ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
            </span>
            <span className="text-xs font-medium text-slate-200">{toast.message}</span>
            <X className="ml-2 h-3.5 w-3.5 shrink-0 text-slate-500" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
