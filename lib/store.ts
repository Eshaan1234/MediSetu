import { MEDICINES, PHARMACIES, buildSeedStock, buildSeedTransactions } from "./seed";
import type { ExternalListing, Medicine, Pharmacy, SourceStatus, StockRow, Transaction, TxnType } from "./types";
import { haversineKm, uid } from "./utils";

const KV_KEY = "medisetu:state:v1";

interface State {
  medicines: Medicine[];
  pharmacies: Pharmacy[];
  stock: StockRow[];
  transactions: Transaction[];
  listings: ExternalListing[];
  sourceStatuses: SourceStatus[];
  initializedAt: string;
}

type PersistMode = "memory" | "upstash" | "neon";

function freshState(): State {
  return {
    medicines: MEDICINES,
    pharmacies: PHARMACIES,
    stock: buildSeedStock(),
    transactions: buildSeedTransactions(),
    listings: [],
    sourceStatuses: [],
    initializedAt: new Date().toISOString(),
  };
}

const g = globalThis as unknown as { __medisetu?: { state: State; init: Promise<void> | null; persistMode: PersistMode } };
if (!g.__medisetu) g.__medisetu = { state: freshState(), init: null, persistMode: "memory" };

function persistMode(): PersistMode {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) return "upstash";
  if (process.env.DATABASE_URL) return "neon";
  return "memory";
}

async function readRemote(): Promise<State | null> {
  const mode = persistMode();
  try {
    if (mode === "upstash") {
      const url = process.env.UPSTASH_REDIS_REST_URL!;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify([["GET", KV_KEY]]),
        cache: "no-store",
      });
      const json = (await res.json()) as { result?: Array<{ result?: string }> };
      const raw = json.result?.[0]?.result;
      return raw ? (JSON.parse(raw) as State) : null;
    }
    if (mode === "neon") {
      const { neon } = await import("@neondatabase/serverless");
      const sql = neon(process.env.DATABASE_URL!);
      await sql`CREATE TABLE IF NOT EXISTS medisetu_kv (key text PRIMARY KEY, value jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())`;
      const rows = (await sql`SELECT value FROM medisetu_kv WHERE key = ${KV_KEY}`) as Array<{ value: State }>;
      return rows[0]?.value ?? null;
    }
  } catch (err) {
    console.warn("[store] remote read failed, using seed state:", err);
  }
  return null;
}

async function writeRemote(state: State): Promise<void> {
  const mode = persistMode();
  try {
    if (mode === "upstash") {
      await fetch(process.env.UPSTASH_REDIS_REST_URL!, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN!}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([["SET", KV_KEY, JSON.stringify(state)]]),
        cache: "no-store",
      });
    } else if (mode === "neon") {
      const { neon } = await import("@neondatabase/serverless");
      const sql = neon(process.env.DATABASE_URL!);
      await sql`INSERT INTO medisetu_kv (key, value, updated_at) VALUES (${KV_KEY}, ${JSON.stringify(state)}, now()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
    }
  } catch (err) {
    console.warn("[store] remote write failed:", err);
  }
}

export async function getState(): Promise<State> {
  g.__medisetu!.persistMode = persistMode();
  if (!g.__medisetu!.init) {
    g.__medisetu!.init = (async () => {
      const remote = await readRemote();
      if (remote?.medicines?.length && remote?.stock) g.__medisetu!.state = remote;
    })();
  }
  await g.__medisetu!.init;
  return g.__medisetu!.state;
}

async function commit(): Promise<void> {
  if (g.__medisetu!.persistMode !== "memory") await writeRemote(g.__medisetu!.state);
}

export async function storageMode(): Promise<PersistMode> {
  await getState();
  return g.__medisetu!.persistMode;
}

export async function adjustStock(input: {
  pharmacyId: string;
  medicineId: string;
  delta: number;
  type: TxnType;
  note?: string;
  raw?: string;
  source?: Transaction["source"];
  confidence?: number;
}): Promise<{ row: StockRow; transaction: Transaction; clamped: boolean }> {
  const state = await getState();
  const medicine = state.medicines.find((m) => m.id === input.medicineId);
  if (!medicine) throw new Error(`Unknown medicine: ${input.medicineId}`);
  if (!state.pharmacies.some((p) => p.id === input.pharmacyId)) throw new Error("Unknown pharmacy");
  let row = state.stock.find((s) => s.pharmacyId === input.pharmacyId && s.medicineId === input.medicineId);
  if (!row) {
    row = {
      pharmacyId: input.pharmacyId,
      medicineId: input.medicineId,
      quantity: 0,
      reorderLevel: 15,
      price: medicine.price,
      unit: "strip",
      updatedAt: new Date().toISOString(),
    };
    state.stock.push(row);
  }
  const previous = row.quantity;
  let delta = Math.trunc(input.delta);
  if (delta === 0) delta = input.type === "sale" ? -1 : 1;
  if (input.type === "sale" && delta > 0) delta = -delta;
  if (input.type === "purchase" && delta < 0) delta = Math.abs(delta);
  const clamped = row.quantity + delta < 0;
  if (clamped) delta = -row.quantity;
  row.quantity += delta;
  row.updatedAt = new Date().toISOString();
  const transaction: Transaction = {
    id: uid("txn"),
    pharmacyId: input.pharmacyId,
    medicineId: input.medicineId,
    type: input.type,
    delta,
    quantity: Math.abs(delta),
    note: input.note ?? (input.type === "sale" ? "Sale" : input.type === "purchase" ? "Purchase" : "Manual adjustment"),
    raw: input.raw ?? "",
    source: input.source ?? "manual",
    confidence: input.confidence ?? 1,
    createdAt: new Date().toISOString(),
  };
  state.transactions.unshift(transaction);
  if (state.transactions.length > 800) state.transactions.length = 800;
  await commit();
  return { row, transaction, clamped };
}

export async function setListings(listings: ExternalListing[], statuses: SourceStatus[]): Promise<void> {
  const state = await getState();
  state.listings = listings;
  state.sourceStatuses = statuses;
  await commit();
}

export async function getCatalog() {
  const state = await getState();
  return state;
}

export type MedicineHit = Medicine & {
  minPrice: number;
  maxPrice: number;
  pharmacyCount: number;
  inStockCount: number;
  availableCities: string[];
  alternatives: string[];
};

export async function searchMedicines(query: string, city?: string): Promise<MedicineHit[]> {
  const state = await getState();
  const q = query.trim().toLowerCase();
  const scored = state.medicines
    .map((m) => {
      const hay = [m.name, m.salt, m.strength, m.manufacturer, m.category, ...m.aliases].join(" ").toLowerCase();
      let score = 0;
      if (!q) score = 1;
      else if (m.name.toLowerCase() === q) score = 100;
      else if (m.name.toLowerCase().startsWith(q)) score = 80;
      else if (hay.includes(q)) score = 50;
      else if (q.length > 3 && q.split(/\s+/).some((word) => hay.includes(word))) score = 25;
      return { m, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map(({ m }) => {
    const rows = state.stock.filter((s) => s.medicineId === m.id);
    const relevant = city ? rows.filter((r) => state.pharmacies.find((p) => p.id === r.pharmacyId)?.city.toLowerCase().includes(city.toLowerCase())) : rows;
    const priced = relevant.map((r) => r.price);
    const alternatives = state.medicines.filter((x) => x.salt === m.salt && x.id !== m.id).map((x) => x.id);
    return {
      ...m,
      minPrice: priced.length ? Math.min(...priced) : m.price,
      maxPrice: priced.length ? Math.max(...priced) : m.mrp,
      pharmacyCount: relevant.length,
      inStockCount: relevant.filter((r) => r.quantity > 0).length,
      availableCities: [...new Set(relevant.map((r) => state.pharmacies.find((p) => p.id === r.pharmacyId)?.city).filter(Boolean))] as string[],
      alternatives,
    };
  });
}

export type PharmacyHit = Pharmacy & { distanceKm?: number; stock?: StockRow & { medicine: Medicine }; price?: number };

export async function findPharmacies(opts: {
  query?: string;
  lat?: number;
  lng?: number;
  medicineId?: string;
  city?: string;
  inStockOnly?: boolean;
}): Promise<PharmacyHit[]> {
  const state = await getState();
  const q = (opts.query ?? "").trim().toLowerCase();
  let list = state.pharmacies.filter((p) => {
    const hay = `${p.name} ${p.chain} ${p.city} ${p.address} ${p.pincode}`.toLowerCase();
    return !q || hay.includes(q);
  });
  if (opts.city) list = list.filter((p) => p.city.toLowerCase().includes(opts.city!.toLowerCase()));
  const result = list.map((p) => {
    const hit: PharmacyHit = { ...p };
    if (opts.lat != null && opts.lng != null) hit.distanceKm = haversineKm(opts.lat, opts.lng, p.lat, p.lng);
    if (opts.medicineId) {
      const row = state.stock.find((s) => s.pharmacyId === p.id && s.medicineId === opts.medicineId);
      if (row) {
        const medicine = state.medicines.find((m) => m.id === opts.medicineId)!;
        hit.stock = { ...row, medicine };
        hit.price = row.price;
      }
    }
    return hit;
  });
  if (opts.inStockOnly && opts.medicineId) {
    return result.filter((p) => p.stock && p.stock.quantity > 0).sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  }
  return result.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0) || b.rating - a.rating);
}

export async function getInventory(pharmacyId?: string) {
  const state = await getState();
  const rows = state.stock
    .filter((s) => !pharmacyId || s.pharmacyId === pharmacyId)
    .map((s) => ({ ...s, medicine: state.medicines.find((m) => m.id === s.medicineId)!, pharmacy: state.pharmacies.find((p) => p.id === s.pharmacyId)! }))
    .filter((s) => s.medicine && s.pharmacy)
    .sort((a, b) => a.quantity - b.quantity);
  return rows;
}

export async function getTransactions(pharmacyId?: string, limit = 40) {
  const state = await getState();
  return state.transactions
    .filter((t) => !pharmacyId || t.pharmacyId === pharmacyId)
    .slice(0, limit)
    .map((t) => ({ ...t, medicine: state.medicines.find((m) => m.id === t.medicineId) }));
}

export async function getAnalytics(pharmacyId?: string) {
  const state = await getState();
  const txns = state.transactions.filter((t) => !pharmacyId || t.pharmacyId === pharmacyId);
  const stock = state.stock.filter((s) => !pharmacyId || s.pharmacyId === pharmacyId);
  const today = new Date();
  const trend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const day = d.toDateString();
    const dayTxns = txns.filter((t) => new Date(t.createdAt).toDateString() === day);
    return {
      day: d.toLocaleDateString("en-IN", { weekday: "short" }),
      sales: dayTxns.filter((t) => t.type === "sale").reduce((n, t) => n + Math.abs(t.delta), 0),
      purchases: dayTxns.filter((t) => t.type === "purchase").reduce((n, t) => n + Math.abs(t.delta), 0),
    };
  });
  const movers = Object.entries(
    txns.filter((t) => t.type === "sale").reduce<Record<string, number>>((acc, t) => {
      acc[t.medicineId] = (acc[t.medicineId] ?? 0) + Math.abs(t.delta);
      return acc;
    }, {}),
  )
    .map(([id, count]) => ({ medicine: state.medicines.find((m) => m.id === id), count }))
    .filter((x) => x.medicine)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  return {
    skus: stock.length,
    units: stock.reduce((n, s) => n + s.quantity, 0),
    lowStock: stock.filter((s) => s.quantity > 0 && s.quantity <= s.reorderLevel).length,
    outOfStock: stock.filter((s) => s.quantity === 0).length,
    salesToday: trend[6]?.sales ?? 0,
    trend,
    movers,
    inventoryValue: Math.round(stock.reduce((n, s) => n + s.quantity * s.price, 0)),
  };
}

export async function findMedicineById(id: string) {
  const state = await getState();
  return state.medicines.find((m) => m.id === id);
}
