export type Role = "customer" | "owner";

export type LanguageCode =
  | "en" | "hi" | "bn" | "ta" | "te" | "mr" | "gu" | "kn" | "ml" | "pa"
  | "or" | "as" | "ur" | "ne" | "si" | "ks" | "kok" | "mai" | "sa" | "sd"
  | "brx" | "doi" | "mni";

export interface Language {
  code: LanguageCode;
  label: string;
  native: string;
  locale: string;
  speech: string;
  rtl?: boolean;
}

export interface Medicine {
  id: string;
  name: string;
  salt: string;
  strength: string;
  form: string;
  manufacturer: string;
  category: string;
  prescription: boolean;
  price: number;
  mrp: number;
  pack: string;
  aliases: string[];
}

export interface Pharmacy {
  id: string;
  name: string;
  chain: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  phone: string;
  hours: string;
  rating: number;
  delivery: boolean;
  source: "seed" | "live";
}

export interface StockRow {
  pharmacyId: string;
  medicineId: string;
  quantity: number;
  reorderLevel: number;
  price: number;
  unit: string;
  updatedAt: string;
}

export type TxnType = "sale" | "purchase" | "adjustment";

export interface Transaction {
  id: string;
  pharmacyId: string;
  medicineId: string;
  type: TxnType;
  delta: number;
  quantity: number;
  note: string;
  raw: string;
  source: "ai" | "manual" | "seed";
  confidence: number;
  createdAt: string;
}

export interface ExternalListing {
  source: string;
  name: string;
  price: number;
  mrp: number;
  url: string;
  pack: string;
  pharmacyName: string;
  city: string;
  inStock: boolean;
  fetchedAt: string;
}

export interface SourceStatus {
  id: string;
  name: string;
  ok: boolean;
  count: number;
  detail: string;
  durationMs: number;
}

export interface InterpretResult {
  understood: boolean;
  type: TxnType | null;
  medicineId: string | null;
  medicineName: string | null;
  pharmacyId: string | null;
  quantity: number | null;
  confidence: number;
  explanation: string;
  engine: "ai" | "local";
  applied?: { previous: number; current: number; reorderLevel: number; lowStock: boolean };
  warnings: string[];
}
