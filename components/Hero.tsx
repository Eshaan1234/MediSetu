"use client";

import { motion } from "framer-motion";
import { ArrowRight, Crosshair, MapPin, Mic, Search, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/app/providers";
import { LANGUAGES } from "@/lib/i18n";

interface SpeechLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

const QUICK = ["Dolo 650", "Pan 40", "Azithral 500", "Zincovit", "ORS"];
const NODES = [
  { x: 70, y: 118, label: "Mumbai" },
  { x: 118, y: 86, label: "Pune" },
  { x: 195, y: 62, label: "Delhi" },
  { x: 170, y: 142, label: "Hyderabad" },
  { x: 112, y: 190, label: "Bengaluru" },
  { x: 52, y: 205, label: "Kochi" },
  { x: 252, y: 126, label: "Kolkata" },
  { x: 216, y: 96, label: "Lucknow" },
];

export function Hero({
  query,
  setQuery,
  onSearch,
  onLocate,
  status,
}: {
  query: string;
  setQuery: (q: string) => void;
  onSearch: (q: string) => void;
  onLocate: () => void;
  status: { medicines?: number; pharmacies?: number; liveListings?: number; scraping?: string } | null;
}) {
  const { t, language } = useApp();
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recRef = useRef<SpeechLike | null>(null);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    setSpeechSupported(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
    return () => recRef.current?.stop();
  }, []);

  const voice = () => {
    const w = window as unknown as { SpeechRecognition?: new () => SpeechLike; webkitSpeechRecognition?: new () => SpeechLike };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new Ctor();
    rec.lang = language.speech;
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript ?? "";
      if (text) { setQuery(text); onSearch(text); }
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  return (
    <section className="relative overflow-hidden pb-6 pt-28 sm:pt-32">
      <div className="glow-orb -left-24 top-10 h-72 w-72 bg-mint/20 animate-float" />
      <div className="glow-orb -right-16 top-40 h-80 w-80 bg-sky/20 animate-float [animation-delay:-3s]" />

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="eyebrow">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
            </span>
            One search · every pharmacy · your language
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.08 }}
            className="max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[62px]"
          >
            <span className="gradient-text">{t("heroTitle")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.16 }}
            className="mt-5 max-w-xl text-[15px] leading-7 text-slate-400 sm:text-base"
          >
            {t("heroSub")}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.24 }} className="mt-8">
            <div className="glass grid grid-cols-2 gap-2 rounded-2xl p-2 focus-within:border-mint/40 sm:flex sm:items-center">
              <div className="relative col-span-2 sm:col-span-1 sm:flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") onSearch(query); }}
                  placeholder={t("searchPlaceholder")}
                  aria-label={t("search")}
                  className="w-full bg-transparent py-3.5 pl-12 pr-3 text-sm text-white outline-none placeholder:text-slate-500"
                />
              </div>
              {speechSupported && (
                <button
                  onClick={voice}
                  title={`${t("voice")} (Chrome / Edge)`}
                  className={`grid h-11 w-full shrink-0 place-items-center rounded-xl border transition sm:w-11 ${
                    listening ? "border-rose-400/60 bg-rose-500/20 text-rose-300" : "border-white/10 bg-white/[0.05] text-slate-300 hover:border-mint/50 hover:text-mint"
                  }`}
                >
                  <Mic className={`h-4 w-4 ${listening ? "animate-pulse" : ""}`} />
                </button>
              )}
              <button onClick={() => onSearch(query)} className={`btn-primary !w-full !rounded-xl !px-5 !py-3 sm:!w-auto ${speechSupported ? "" : "col-span-2 sm:col-span-1"}`}>
                {t("search")} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t("popular")}</span>
              {QUICK.map((q) => (
                <button key={q} onClick={() => { setQuery(q); onSearch(q); }} className="chip">
                  {q} <ArrowRight className="h-3 w-3 opacity-60" />
                </button>
              ))}
              <button onClick={onLocate} className="chip !border-sky/30 !text-sky-200">
                <Crosshair className="h-3 w-3" /> {t("useLocation")}
              </button>
            </div>
          </motion.div>

        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, x: 24 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="relative hidden lg:block"
        >
          <div className="glass relative overflow-hidden rounded-[28px] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-white"><MapPin className="h-4 w-4 text-mint" /> India medicine network</div>
                <div className="mt-1 text-[11px] text-slate-500">Live availability · 25 cities connected</div>
              </div>
              <span className="badge border border-mint/25 bg-mint/10 text-mint"><span className="h-1.5 w-1.5 rounded-full bg-mint" /> LIVE</span>
            </div>

            <svg viewBox="0 0 320 250" className="w-full">
              <defs>
                <linearGradient id="line" x1="0" x2="1">
                  <stop offset="0%" stopColor="#34e2b0" stopOpacity=".15" />
                  <stop offset="100%" stopColor="#5eb8ff" stopOpacity=".85" />
                </linearGradient>
                <radialGradient id="glow"><stop stopColor="#34e2b0" stopOpacity=".5" /><stop offset="1" stopColor="#34e2b0" stopOpacity="0" /></radialGradient>
              </defs>
              <path d={NODES.map((n, i) => `${i ? "L" : "M"} ${n.x} ${n.y}`).join(" ")} fill="none" stroke="url(#line)" strokeWidth="1.3" className="mesh-line" />
              {NODES.map((n, i) => (
                <g key={n.label}>
                  <circle cx={n.x} cy={n.y} r="26" fill="url(#glow)" opacity={i % 3 === 0 ? 0.7 : 0.25} />
                  <motion.circle
                    cx={n.x} cy={n.y} r="9" fill="none" stroke="#34e2b0" strokeWidth="1"
                    animate={{ r: [6, 18], opacity: [0.8, 0] }}
                    transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.3 }}
                  />
                  <circle cx={n.x} cy={n.y} r={i === 1 ? 5.5 : 3.5} fill={i === 1 ? "#fbbf24" : "#34e2b0"} stroke="#07101e" strokeWidth="2" />
                  <text x={n.x + 9} y={n.y + 3.5} fontSize="8.5" fill={i === 1 ? "#fcd34d" : "#9fb2cc"}>{n.label}</text>
                </g>
              ))}
            </svg>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <motion.div whileHover={{ y: -3 }} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Most searched</div>
                <div className="mt-1 flex items-center justify-between text-sm font-semibold text-white">Dolo 650 <span className="text-mint">₹32</span></div>
                <div className="mt-1 text-[10px] text-slate-500">18 pharmacies nearby</div>
              </motion.div>
              <motion.div whileHover={{ y: -3 }} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">AI alert</div>
                <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-amber-300"><Sparkles className="h-3.5 w-3.5" /> Restock soon</div>
                <div className="mt-1 text-[10px] text-slate-500">Pan 40 · 8 units left</div>
              </motion.div>
            </div>
          </div>
          <div className="glow-orb -bottom-10 right-0 h-52 w-52 bg-sky/20" />
        </motion.div>
      </div>
    </section>
  );
}
