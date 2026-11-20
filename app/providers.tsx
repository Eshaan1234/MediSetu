"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { findLanguage, translate } from "@/lib/i18n";
import type { TKey } from "@/lib/i18n";
import type { Language, LanguageCode, Role } from "@/lib/types";

interface Toast {
  id: number;
  message: string;
  tone: "ok" | "warn" | "info";
}

interface AppContextValue {
  lang: LanguageCode;
  language: Language;
  setLang: (code: LanguageCode) => void;
  t: (key: TKey) => string;
  toast: Toast | null;
  notify: (message: string, tone?: Toast["tone"]) => void;
  role: Role | null;
  login: (role: Role) => void;
  browseAsCustomer: () => void;
  signOut: () => void;
  savedIds: string[];
  toggleSaved: (id: string) => void;
  isSaved: (id: string) => boolean;
  pharmacyId: string;
  setPharmacyId: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>("en");
  const [toast, setToast] = useState<Toast | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [pharmacyId, setPharmacyIdState] = useState("ph-pune-apollo");

  useEffect(() => {
    const store = window.localStorage;
    const savedLang = store.getItem("medisetu-lang") as LanguageCode | null;
    if (savedLang) {
      setLangState(savedLang);
    } else {
      // First visit: follow the device/browser language when it is an Indian language.
      const raw = (navigator.languages?.[0] || navigator.language || "en").toLowerCase();
      const prefix = raw.split("-")[0];
      const supported = ["en", "hi", "bn", "ta", "te", "mr", "gu", "kn", "ml", "pa", "or", "as", "ur", "ne", "si", "ks", "kok", "mai", "sa", "sd", "brx", "doi", "mni"];
      if (supported.includes(prefix)) setLangState(prefix as LanguageCode);
    }
    const savedRole = store.getItem("medisetu-role");
    if (savedRole === "customer" || savedRole === "owner") setRole(savedRole);
    const savedList = store.getItem("medisetu-saved");
    if (savedList) {
      try { setSavedIds(JSON.parse(savedList) as string[]); } catch { /* ignore corrupt storage */ }
    }
    const savedPharmacy = store.getItem("medisetu-pharmacy");
    if (savedPharmacy) setPharmacyIdState(savedPharmacy);
  }, []);

  useEffect(() => {
    const language = findLanguage(lang);
    document.documentElement.lang = language.locale;
    document.documentElement.dir = language.rtl ? "rtl" : "ltr";
    window.localStorage.setItem("medisetu-lang", lang);
  }, [lang]);

  useEffect(() => { window.localStorage.setItem("medisetu-saved", JSON.stringify(savedIds)); }, [savedIds]);
  useEffect(() => { window.localStorage.setItem("medisetu-pharmacy", pharmacyId); }, [pharmacyId]);

  const setLang = useCallback((code: LanguageCode) => setLangState(code), []);
  const t = useCallback((key: TKey) => translate(lang, key), [lang]);
  const notify = useCallback((message: string, tone: Toast["tone"] = "info") => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  const login = useCallback((next: "customer" | "owner") => {
    setRole(next);
    window.localStorage.setItem("medisetu-role", next);
  }, []);
  const browseAsCustomer = useCallback(() => {
    setRole("customer");
    window.localStorage.setItem("medisetu-role", "customer");
  }, []);
  const signOut = useCallback(() => {
    window.localStorage.removeItem("medisetu-role");
    setRole(null);
  }, []);

  const toggleSaved = useCallback((id: string) => {
    setSavedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);
  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds]);
  const setPharmacyId = useCallback((id: string) => setPharmacyIdState(id), []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const value = useMemo(
    () => ({
      lang, language: findLanguage(lang), setLang, t, toast, notify,
      role, login, browseAsCustomer, signOut,
      savedIds, toggleSaved, isSaved,
      pharmacyId, setPharmacyId,
    }),
    [lang, setLang, t, toast, notify, role, login, browseAsCustomer, signOut, savedIds, toggleSaved, isSaved, pharmacyId, setPharmacyId],
  );
  return (
    <SessionProvider>
      <AppContext.Provider value={value}>{children}</AppContext.Provider>
    </SessionProvider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside Providers");
  return ctx;
}
