"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, Bot, CheckCircle2, Lightbulb, Mic, Send, Sparkles, WandSparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/app/providers";
import type { InterpretResult, Pharmacy } from "@/lib/types";

interface Msg {
  id: number;
  role: "user" | "ai";
  text: string;
  result?: InterpretResult;
  error?: boolean;
}

interface SpeechLike {
  lang: string;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

const EN_EXAMPLES = [
  "Sold 3 strips of Dolo 650",
  "Received 50 boxes of Crocin Advance",
  "sold 2 Azithral 500 at Apollo Pharmacy Pune",
  "add 24 Pan 40 to stock",
];
const HI_EXAMPLES = ["3 डोलो 650 बेचे", "50 क्रोसिन स्टॉक में जोड़ें", "पैन 40 के 5 स्ट्रिप बेचे"];

export function InventoryAI({ pharmacyId, pharmacies, onApplied }: { pharmacyId: string; pharmacies: Pharmacy[]; onApplied: () => void }) {
  const { t, lang, language, notify } = useApp();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recRef = useRef<SpeechLike | null>(null);
  const [autoApply, setAutoApply] = useState(true);
  const [messages, setMessages] = useState<Msg[]>([
    { id: 1, role: "ai", text: "Hi! Tell me what happened in your pharmacy, for example “Sold 5 strips of Dolo 650”. I'll update stock for you." },
  ]);
  const endRef = useRef<HTMLDivElement | null>(null);
  const examples = ["hi", "mr", "sa", "mai", "brx", "doi", "ne"].includes(lang) ? HI_EXAMPLES : EN_EXAMPLES;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages, busy]);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => SpeechLike; webkitSpeechRecognition?: new () => SpeechLike };
    setSpeechSupported(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
    return () => recRef.current?.stop();
  }, []);

  const dictate = () => {
    const w = window as unknown as { SpeechRecognition?: new () => SpeechLike; webkitSpeechRecognition?: new () => SpeechLike };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const rec = new Ctor();
    rec.lang = language.speech;
    rec.onresult = (e) => { setText(e.results[0]?.[0]?.transcript ?? ""); setListening(false); };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  const pharmacy = pharmacies.find((p) => p.id === pharmacyId);

  const submit = async (value?: string) => {
    const command = (value ?? text).trim();
    if (!command || busy) return;
    if (!pharmacyId) { notify("Select a pharmacy first", "warn"); return; }
    setText("");
    setBusy(true);
    setMessages((m) => [...m, { id: Date.now(), role: "user", text: command }]);
    try {
      const res = await fetch("/api/ai/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: command, pharmacyId, language: lang, apply: autoApply }),
      });
      const data = (await res.json()) as InterpretResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setMessages((m) => [...m, { id: Date.now() + 1, role: "ai", text: data.understood ? data.explanation : t("failed"), result: data }]);
      if (data.applied) {
        onApplied();
        notify(`${data.medicineName}: ${data.applied.previous} → ${data.applied.current} units`, "ok");
      }
    } catch (err) {
      setMessages((m) => [...m, { id: Date.now() + 1, role: "ai", text: err instanceof Error ? err.message : t("failed"), error: true }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass flex min-h-[620px] flex-col overflow-hidden rounded-3xl">
      <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.07] px-5 py-4">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-mint/25 to-sky/25 text-mint"><Bot className="h-5 w-5" /></span>
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-white">{t("aiTitle")} <Sparkles className="h-3.5 w-3.5 text-mint" /></div>
          <div className="text-[11px] text-slate-500">{pharmacy?.name ?? "Select a pharmacy"} · English + 22 Indian languages</div>
        </div>
        <button
          onClick={() => setAutoApply((v) => !v)}
          className={`ml-auto rounded-full border px-3 py-1.5 text-[10px] font-semibold transition ${autoApply ? "border-mint/35 bg-mint/10 text-mint" : "border-white/10 text-slate-400"}`}
          title="When off, the assistant only previews the change"
        >
          {autoApply ? "AUTO-APPLY ON" : "PREVIEW ONLY"}
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[#070d19]/40 px-5 py-5" style={{ maxHeight: 470 }}>
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "ai" && <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-mint/15 text-mint"><Bot className="h-3.5 w-3.5" /></span>}
              <div className={`max-w-[86%] ${m.role === "user" ? "rounded-2xl rounded-br-md bg-mint/15 px-4 py-2.5 text-sm text-white" : "rounded-2xl rounded-bl-md border border-white/[0.07] bg-white/[0.035] px-4 py-3"}`}>
                {m.role === "user" ? m.text : (
                  <>
                    <p className={`text-[13px] leading-6 ${m.error ? "text-rose-300" : "text-slate-200"}`}>{m.text}</p>
                    {m.result && <ResultCard result={m.result} />}
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {busy && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-mint/10 text-mint"><Bot className="h-3.5 w-3.5" /></span>
            <span className="flex gap-1">{[0, 1, 2].map((i) => <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-mint" animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15 }} />)}</span>
            {t("thinking")}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-white/[0.07] p-4">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {examples.map((ex) => (
            <button key={ex} onClick={() => submit(ex)} disabled={busy} className="chip !py-1 !text-[10px] disabled:opacity-40"><Lightbulb className="h-3 w-3 text-amber-300/80" />{ex}</button>
          ))}
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); submit(); }}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0a1120] p-1.5 focus-within:border-mint/40"
        >
          {speechSupported && (
            <button type="button" onClick={dictate} className={`grid h-9 w-9 place-items-center rounded-lg transition ${listening ? "text-rose-300" : "text-slate-500 hover:text-mint"}`} title="Dictate stock update">
              <Mic className={`h-4 w-4 ${listening ? "animate-pulse" : ""}`} />
            </button>
          )}
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder={t("aiPlaceholder")} className="min-w-0 flex-1 bg-transparent px-1 text-sm text-white outline-none placeholder:text-slate-600" />
          <button type="submit" disabled={busy || !text.trim()} className="btn-primary !rounded-lg !px-3.5 !py-2 !text-xs disabled:opacity-40">
            <Send className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{t("send")}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: InterpretResult }) {
  const { t } = useApp();
  if (!result.understood) {
    return (
      <div className="mt-3 space-y-1.5 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-3">
        {result.warnings.map((w) => <div key={w} className="flex gap-1.5 text-[11px] text-amber-200/90"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />{w}</div>)}
      </div>
    );
  }
  const sale = result.type === "sale";
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 overflow-hidden rounded-xl border border-mint/20 bg-[#07161c]">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-3 py-2.5">
        <span className={`badge ${sale ? "border-rose-400/25 bg-rose-400/10 text-rose-300" : "border-mint/25 bg-mint/10 text-mint"}`}>
          {sale ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
          {sale ? t("sale") : t("purchase")}
        </span>
        <span className="text-xs font-semibold text-white">{result.quantity} × {result.medicineName}</span>
        <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-400"><WandSparkles className="h-3 w-3 text-mint" /> {Math.round(result.confidence * 100)}% confidence</span>
      </div>
      <div className="space-y-2 px-3 py-3">
        <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
          <motion.div initial={{ width: 0 }} animate={{ width: `${result.confidence * 100}%` }} className={`h-full rounded-full ${sale ? "bg-rose-400" : "bg-mint"}`} />
        </div>
        {result.applied && (
          <div className="flex items-center gap-3 rounded-lg bg-white/[0.035] px-3 py-2 text-xs">
            <span className="text-slate-400">Stock <strong className="text-white">{result.applied.previous}</strong></span>
            <ArrowRight className="h-3.5 w-3.5 text-mint" />
            <span className="font-bold text-white">{result.applied.current}</span>
            <span className="ml-auto flex items-center gap-1 text-mint"><CheckCircle2 className="h-3.5 w-3.5" /> {t("applied")}</span>
          </div>
        )}
        {result.warnings.map((w) => (
          <div key={w} className="flex gap-1.5 text-[11px] text-amber-200/80"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />{w}</div>
        ))}
      </div>
    </motion.div>
  );
}
