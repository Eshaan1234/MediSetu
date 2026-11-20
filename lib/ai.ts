import { getCatalog } from "./store";
import type { InterpretResult, LanguageCode, TxnType } from "./types";
import { norm } from "./utils";

const SALE_WORDS = [
  "sold", "sale", "sell", "billed", "dispensed", "issued", "out", "decrease", "remove",
  "बेचा", "बेची", "बेचे", "बिक्री", "विक्रय", "विक्की", "कम", "घटाएँ",
  "விற்ற", "விற்பனை", "விற்க", "குறை", "அகற்று",
  "అమ్మిన", "అమ్మి", "విక్రయం", "విక్రయ", "తగ్గించు",
  "বেচা", "বিক্রয়", "কমানো", "কম",
  "વેચી", "વેચ્યું", "વિક્રય", "ઘટાડો",
  "বিক্ৰী", "কমোও", "ಮಾರಿದ", "ಮಾರಾಟ", "ಕಡಿಮೆ",
  "വിറ്റ", "വിൽപ്പന", "കുറയ്ക്കുക", "ବିକ୍ରି", "କମାନ୍ତୁ",
  "فروخت", "بिक्री", "कम", "বেচ",
];
const BUY_WORDS = [
  "bought", "buy", "purchase", "purchased", "received", "restock", "refill", "added", "stock in", "incoming", "increase", "ordered",
  "खरीदा", "खरीदी", "खरीद", "प्राप्त", "आपूर्ति", "जोड़ा", "जोड़", "भरपूर्ति", "बढ़ाएँ",
  "வாங்க", "கொள்முதல்", "பெற்ற", "சேர்", "அதிகரி",
  "కొన్న", "కొనుగోలు", "లభించింది", "జోడించు", "పెంచు",
  "কেনা", "ক্রয়", "পেয়েছি", "যোগ", "বাড়ানো",
  "ખરીદ", "ખરીદી", "પ્રાપ્ત", "ઉમેરો", "વધારો",
  "ಖರೀದಿ", "ಕೊಂಡ", "ಸ್ವೀಕರಿಸಲಾಗಿದೆ", "ಸೇರಿಸಿ", "ಹೆಚ್ಚಿಸಿ",
  "വാങ്ങി", "വാങ്ങൽ", "ലഭിച്ചു", "ചേർക്കുക", "വർദ്ധിപ്പിക്കുക",
  "କିଣିଲି", "କ୍ରୟ", "ଯୋଗ କରନ୍ତୁ", "فروید", "خرید",
];

function detectType(text: string): TxnType | null {
  const t = norm(text);
  // Scripts outside `norm`'s character ranges would become "" and match everything.
  const saleWords = SALE_WORDS.map(norm).filter((w) => w.length > 1);
  const buyWords = BUY_WORDS.map(norm).filter((w) => w.length > 1);
  const saleIdx = saleWords.map((w) => t.indexOf(w)).filter((i) => i >= 0);
  const buyIdx = buyWords.map((w) => t.indexOf(w)).filter((i) => i >= 0);
  if (saleIdx.length && !buyIdx.length) return "sale";
  if (buyIdx.length && !saleIdx.length) return "purchase";
  if (saleIdx.length && buyIdx.length) {
    return Math.min(...saleIdx) <= Math.min(...buyIdx) ? "sale" : "purchase";
  }
  return null;
}

function detectQuantity(text: string, medicineName: string, aliases: string[]): number | null {
  let cleaned = ` ${norm(text)} `;
  const phrases = [medicineName, ...aliases].sort((a, b) => b.length - a.length);
  for (const phrase of phrases) {
    const p = norm(phrase);
    if (p.length > 1) cleaned = cleaned.split(p).join(" MEDICINE ");
  }
  cleaned = cleaned.replace(/\b\d+(?:\.\d+)?\s*(?:mg|mcg|ml|g)\b/g, " ");
  cleaned = cleaned.replace(/\b(?:ip|nrx|rx)\b/g, " ");
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(?:strips?|boxes?|box|tablets?|capsules?|units?|packs?|pcs?|pieces?|sachets?|bottles?|टेबलेट|गोली|बॉक्स|डिब्बा|पट्टी|பெட்டி|ஸ்ட்ரிப்|బాక్స్|స్ట్రిప్|বাক্স|প্যাক|બોક્સ|ಪ್ಯಾಕ್|ബോക്സ്|ବାକ୍ସ)/i,
    /(?:of|about|around|qty|quantity|approximately|से|की)\s*(\d+(?:\.\d+)?)/i,
    /\b(\d{1,4})\b/,
  ];
  for (const p of patterns) {
    const m = cleaned.match(p);
    if (m) {
      const n = Number(m[1]);
      if (n > 0 && n < 100000) return Math.round(n);
    }
  }
  return null;
}

function detectPharmacy(text: string, defaultId: string | null): { id: string | null; confidence: number; note?: string } {
  const state = catalogCache;
  if (!state) return { id: defaultId, confidence: defaultId ? 0.72 : 0.45 };
  const t = norm(text);
  const explicit = state.pharmacies.find((p) => t.includes(norm(p.name)) || t.includes(norm(p.chain)));
  if (explicit) return { id: explicit.id, confidence: 0.95 };
  const city = state.pharmacies.find((p) => t.includes(norm(p.city)));
  if (city) return { id: city.id, confidence: 0.86 };
  return { id: defaultId, confidence: defaultId ? 0.7 : 0.4, note: defaultId ? undefined : "No pharmacy named or selected" };
}

let catalogCache: Awaited<ReturnType<typeof getCatalog>> | null = null;

function localInterpret(text: string, pharmacyId: string | null): InterpretResult {
  const state = catalogCache!;
  const t = norm(text);
  const type = detectType(text);
  const candidates = state.medicines
    .map((m) => ({
      m,
      match: [m.name, ...m.aliases, m.salt].filter((s) => norm(s).length > 1 && t.includes(norm(s))).sort((a, b) => norm(b).length - norm(a).length)[0],
    }))
    .filter((x) => x.match)
    .sort((a, b) => b.match.length - a.match.length);
  const best = candidates[0];
  const quantity = best ? detectQuantity(text, best.m.name, best.m.aliases) : null;
  const ph = detectPharmacy(text, pharmacyId);
  const warnings: string[] = [];
  if (!type) warnings.push("Could not detect sale vs purchase — say 'sold' or 'received'.");
  if (!best) warnings.push("Medicine name not recognised. Try the brand name, e.g. 'Dolo 650'.");
  if (quantity == null) warnings.push("No quantity found — add a number such as '5 strips'.");
  if (ph.note) warnings.push(ph.note);
  const understood = Boolean(type && best && quantity && ph.id);
  return {
    understood,
    type,
    medicineId: best?.m.id ?? null,
    medicineName: best?.m.name ?? null,
    pharmacyId: ph.id,
    quantity,
    confidence: understood ? Math.max(0.62, Math.min(0.98, ph.confidence * (best!.match.length > 5 ? 1 : 0.9))) : 0.25,
    explanation: understood
      ? `${type === "sale" ? "Sale" : "Purchase"} of ${quantity} ${type === "sale" ? "will be deducted from" : "will be added to"} ${best!.m.name} stock at ${state.pharmacies.find((p) => p.id === ph.id)?.name ?? "the selected pharmacy"}.`
      : "I could not fully understand that command. Check the hints below and try again.",
    engine: "local",
    warnings,
  };
}

async function aiInterpret(text: string, pharmacyId: string | null, language: LanguageCode): Promise<InterpretResult | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const state = catalogCache!;
  const catalogue = state.medicines.map((m) => `${m.id}: ${m.name} (${m.salt} ${m.strength})`).join("\n");
  const pharmacies = state.pharmacies.map((p) => `${p.id}: ${p.name}, ${p.city}`).join("\n");
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a pharmacy inventory assistant for an Indian app. Parse the user's sentence in any Indian language into a stock movement. Return JSON only: {"type":"sale"|"purchase","medicineId":"<id>","pharmacyId":"<id>|null","quantity":<positive integer>,"confidence":0-1,"explanation":"<short sentence>"}. A sale/deduction means stock goes down; purchase/restock/received means stock goes up. Use only these medicine ids:\n${catalogue}\n\nUse only these pharmacy ids (or null if unspecified):\n${pharmacies}`,
          },
          { role: "user", content: `Language: ${language}. Command: ${text}. Default pharmacy id: ${pharmacyId ?? "none"}` },
        ],
      }),
      signal: AbortSignal.timeout(9000),
    });
    if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}") as Partial<InterpretResult>;
    if (!parsed.type || !parsed.medicineId || !state.medicines.some((m) => m.id === parsed.medicineId)) return null;
    const qty = Number(parsed.quantity);
    if (!Number.isFinite(qty) || qty <= 0) return null;
    const pid = state.pharmacies.some((p) => p.id === parsed.pharmacyId) ? parsed.pharmacyId! : pharmacyId;
    if (!pid) return null;
    return {
      understood: true,
      type: parsed.type === "purchase" ? "purchase" : "sale",
      medicineId: parsed.medicineId,
      medicineName: state.medicines.find((m) => m.id === parsed.medicineId)!.name,
      pharmacyId: pid,
      quantity: Math.round(qty),
      confidence: typeof parsed.confidence === "number" ? Math.min(1, Math.max(0.5, parsed.confidence)) : 0.9,
      explanation: parsed.explanation || `Stock ${parsed.type === "sale" ? "deducted" : "added"} successfully.`,
      engine: "ai",
      warnings: [],
    };
  } catch (err) {
    console.warn("[ai] LLM unavailable, using local parser:", err);
    return null;
  }
}

export async function interpretCommand(text: string, pharmacyId: string | null, language: LanguageCode): Promise<InterpretResult> {
  catalogCache = await getCatalog();
  if (process.env.OPENAI_API_KEY) {
    const result = await aiInterpret(text, pharmacyId, language);
    if (result) return result;
  }
  return localInterpret(text, pharmacyId);
}
