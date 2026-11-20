"use client";

import { motion } from "framer-motion";
import { ArrowRight, Globe2, Info, Store, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { getProviders, signIn } from "next-auth/react";
import { useApp } from "@/app/providers";
import { LANGUAGES } from "@/lib/i18n";

export function AuthModal() {
  const { role, login, browseAsCustomer, lang, setLang } = useApp();
  const [selectedRole, setSelectedRole] = useState<"customer" | "owner">("customer");
  const [googleReady, setGoogleReady] = useState(false);

  useEffect(() => {
    getProviders()
      .then((p) => setGoogleReady(Boolean(p?.google)))
      .catch(() => setGoogleReady(false));
  }, []);

  if (role !== null) return null;

  const continueWithGoogle = async () => {
    if (!googleReady) return;
    login(selectedRole); // saved before redirect so the role survives the callback
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[2000] grid place-items-center overflow-y-auto bg-[#03060e]/90 p-4 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="glass relative my-4 w-full max-w-md overflow-hidden rounded-3xl p-6 sm:p-8"
      >
        <div className="glow-orb -left-16 -top-20 h-48 w-48 bg-mint/20" />
        <div className="glow-orb -bottom-24 -right-16 h-48 w-48 bg-sky/20" />

        <div className="relative text-center">
          <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-mint to-sky text-[#05120e] shadow-[0_0_28px_-8px_rgba(52,226,176,.9)]">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 4v16M4 12h16" strokeLinecap="round" /></svg>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Medi<span className="text-mint">Setu</span></h1>
          <p className="mx-auto mt-1.5 max-w-xs text-xs leading-5 text-slate-400">Sign in with Google to find medicines or manage your pharmacy.</p>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-2">
          {(["customer", "owner"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRole(r)}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 text-center transition ${
                selectedRole === r ? "border-mint/50 bg-mint/10 text-mint" : "border-white/10 bg-white/[0.025] text-slate-400 hover:border-white/20"
              }`}
            >
              {r === "customer" ? <UserRound className="h-4 w-4" /> : <Store className="h-4 w-4" />}
              <span className="text-[11px] font-semibold leading-tight">{r === "customer" ? "Customer" : "Pharmacy owner"}</span>
              <span className="text-[9px] leading-tight opacity-70">{r === "customer" ? "Find medicines" : "Manage stock"}</span>
            </button>
          ))}
        </div>

        <div className="relative mt-5">
          {googleReady ? (
            <button onClick={continueWithGoogle} className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#1f2937] transition hover:bg-slate-100 active:scale-[.99]">
              <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.5 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.7 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.1 24.6c0-1.6-.2-3.1-.5-4.6H24v9.1h12.4c-.5 2.9-2.2 5.4-4.7 7l7.6 5.9c4.4-4.1 6.8-10.1 6.8-17.4z" />
                <path fill="#FBBC05" d="M10.4 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.8-6.1C1 16.3 0 20 0 24s1 3.7 2.6 5.8l7.8-6.1z" />
                <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.7l-7.6-5.9c-2.1 1.4-4.8 2.3-8.3 2.3-6.3 0-11.7-3.7-13.6-9.1l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
              </svg>
              Continue with Google
              <ArrowRight className="ml-auto h-4 w-4 opacity-60" />
            </button>
          ) : (
            <div className="flex items-start gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3.5 text-left">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
              <p className="text-[11px] leading-5 text-slate-400">Google sign-in activates when <span className="text-slate-200">GOOGLE_CLIENT_ID</span> and <span className="text-slate-200">GOOGLE_CLIENT_SECRET</span> are added to the deployment.</p>
            </div>
          )}
        </div>

        <div className="relative my-5 flex items-center gap-3 text-[10px] uppercase tracking-widest text-slate-600"><span className="h-px flex-1 bg-white/[0.07]" /> or <span className="h-px flex-1 bg-white/[0.07]" /></div>

        <button onClick={browseAsCustomer} className="relative w-full text-center text-xs font-semibold text-mint hover:underline">
          Continue without signing in
        </button>

        <div className="relative mt-6 flex items-center justify-center gap-2 border-t border-white/[0.06] pt-4 text-[11px] text-slate-500">
          <Globe2 className="h-3.5 w-3.5 text-mint" />
          <select value={lang} onChange={(e) => setLang(e.target.value as typeof lang)} className="max-w-[150px] bg-transparent text-xs text-slate-300 outline-none">
            {LANGUAGES.map((l) => <option key={l.code} value={l.code} className="bg-[#0c1426]">{l.native}</option>)}
          </select>
        </div>
      </motion.div>
    </motion.div>
  );
}
