import type { ExternalListing, SourceStatus } from "./types";
import { uid } from "./utils";

type Json = Record<string, unknown>;

interface Source {
  id: string;
  name: string;
  url: (q: string) => string;
  origin: string;
  headers?: Record<string, string>;
  kind: "html" | "json";
  method?: "GET" | "POST";
  payload?: (q: string) => string;
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export const SOURCES: Source[] = [
  {
    id: "1mg",
    name: "Tata 1mg",
    url: (q) => `https://www.1mg.com/search/all?name=${encodeURIComponent(q)}`,
    origin: "https://www.1mg.com",
    headers: { "Accept-Language": "en-IN,en;q=0.9" },
    kind: "html",
  },
  {
    id: "apollo",
    name: "Apollo 24|7",
    url: () => "https://search.apollo247.com/v4/fullSearch",
    origin: "https://www.apollo247.com",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://www.apollo247.com",
      Referer: "https://www.apollo247.com/",
    },
    kind: "json",
    method: "POST",
    payload: (q) => JSON.stringify({ query: q }),
  },
  {
    id: "netmeds",
    name: "Netmeds",
    url: (q) => `https://www.netmeds.com/catalogsearch/result/q/${encodeURIComponent(q)}`,
    origin: "https://www.netmeds.com",
    headers: { "Accept-Language": "en-IN,en;q=0.9" },
    kind: "html",
  },
  {
    id: "pharmeasy",
    name: "PharmEasy",
    url: (q) => `https://pharmeasy.in/search/all?name=${encodeURIComponent(q)}`,
    origin: "https://pharmeasy.in",
    headers: { "Accept-Language": "en-IN,en;q=0.9" },
    kind: "html",
  },
];

const cache = new Map<string, { at: number; listings: ExternalListing[]; statuses: SourceStatus[] }>();
const TTL = 12 * 60 * 60 * 1000;

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^\d.]/g, ""));
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return null;
}

function absolute(url: string, origin: string): string {
  if (!url) return origin;
  return url.startsWith("http") ? url : `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
}

function normalizeProduct(node: Json, source: Source, query: string): ExternalListing | null {
  const name = String(node.name ?? node.productName ?? node.title ?? node.product_name ?? "").trim();
  if (!name || name.length > 140) return null;
  const priceNode = node.offers ?? node.specialPrice ?? node.salePriceDecimal ?? node.price ?? node.sellingPrice ?? node.finalPrice ?? node.offerPrice;
  let price: number | null = null;
  let mrp: number | null = null;
  if (priceNode && typeof priceNode === "object") {
    const p = priceNode as Json;
    price = asNumber(p.price ?? p.sellingPrice ?? p.specialPrice ?? p.value ?? p.lowPrice);
    mrp = asNumber(p.mrp ?? p.highPrice ?? p.listPrice ?? p.originalPrice);
  } else price = asNumber(priceNode);
  if (price == null) price = asNumber(node.mrp ?? node.actualPrice ?? node.mrpPrice);
  if (price == null && node.price != null) price = asNumber(node.price);
  if (price == null) price = asNumber(node.priceDecimal ?? node.assuredDiscountPrice);
  if (mrp == null) mrp = asNumber(node.mrpDecimal ?? node.mrpPrice ?? node.price);
  if (price == null || price > 100000) return null;
  const slug = String(node.urlKey ?? node.slug ?? "");
  const url = String(node.url ?? node.link ?? node.productUrl ?? node.canonicalUrl ?? (slug ? `/${source.id === "apollo" ? "products" : "online-medicine-order"}/${slug}` : ""));
  const q = query.toLowerCase().split(" ")[0];
  if (q.length > 2 && !name.toLowerCase().includes(q)) {
    // Keep salt-name matches (e.g. query "paracetamol" -> "Paracetamol 650") but reject random noise.
    if (!name.toLowerCase().includes(q.slice(0, 4))) return null;
  }
  return {
    source: source.name,
    name: name.replace(/\s+/g, " "),
    price: Math.round(price),
    mrp: Math.round(mrp ?? price),
    url: absolute(url, source.origin),
    pack: String(node.packSize ?? node.pack ?? node.unitSize ?? node.size ?? "").slice(0, 80),
    pharmacyName: source.name,
    city: "Online delivery",
    inStock: String(node.availability ?? node.inStock ?? "instock").toLowerCase() !== "outofstock",
    fetchedAt: new Date().toISOString(),
  };
}

function walk(node: unknown, visit: (obj: Json) => void, depth = 0): void {
  if (depth > 14 || node == null) return;
  if (Array.isArray(node)) {
    node.slice(0, 400).forEach((x) => walk(x, visit, depth + 1));
    return;
  }
  if (typeof node === "object") {
    const obj = node as Json;
    visit(obj);
    Object.values(obj).slice(0, 80).forEach((v) => walk(v, visit, depth + 1));
  }
}

function extractFromHtml(html: string, source: Source, query: string): ExternalListing[] {
  const found: ExternalListing[] = [];
  const seen = new Set<string>();
  const add = (node: Json) => {
    const product = normalizeProduct(node, source, query);
    if (!product) return;
    const key = product.name.toLowerCase() + product.price;
    if (seen.has(key)) return;
    seen.add(key);
    found.push(product);
  };

  for (const match of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      walk(JSON.parse(match[1]), (obj) => {
        const type = obj["@type"];
        if (type === "Product" || (Array.isArray(type) && type.includes("Product"))) add(obj);
      });
    } catch { /* malformed JSON-LD is common; continue */ }
  }

  for (const pattern of [
    /window\.PRELOADED_STATE\s*=\s*([\s\S]*?);\s*<\/script>/i,
    /window\.__INITIAL_STATE__\s*=\s*([\s\S]*?);\s*<\/script>/i,
    /window\.__NEXT_DATA__\s*=\s*([\s\S]*?)<\/script>/i,
    /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i,
  ]) {
    const match = html.match(pattern);
    if (!match) continue;
    try {
      walk(JSON.parse(match[1]), add);
    } catch { /* ignore */ }
  }

  // Last resort: product cards with a visible rupee price.
  for (const match of html.matchAll(/href="([^"]*(?:\/drugs\/|\/product\/|\/p\/)[^"]*)"[^>]*>([\s\S]{0,900}?)<\/a>/gi)) {
    const block = match[2];
    const name = block.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim().slice(0, 120);
    const price = asNumber(block.match(/[₹]\s*([\d,]+(?:\.\d+)?)/)?.[1] ?? "");
    if (name && price) add({ name, sellingPrice: price, url: match[1] } as Json);
  }
  return found.slice(0, 8);
}

async function fetchSource(source: Source, query: string): Promise<{ listings: ExternalListing[]; status: SourceStatus }> {
  const started = Date.now();
  try {
    const post = source.method === "POST";
    const res = await fetch(source.url(query), {
      method: post ? "POST" : "GET",
      headers: {
        "User-Agent": UA,
        Accept: post ? "application/json" : "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9",
        Referer: source.origin + "/",
        ...source.headers,
      },
      body: post ? source.payload?.(query) : undefined,
      signal: AbortSignal.timeout(7000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    let listings: ExternalListing[];
    if (source.kind === "json") {
      const seen = new Set<string>();
      listings = [];
      walk(JSON.parse(text), (obj) => {
        const product = normalizeProduct(obj, source, query);
        if (!product) return;
        const key = product.name.toLowerCase() + product.price;
        if (seen.has(key)) return;
        seen.add(key);
        listings.push(product);
      });
      listings = listings.slice(0, 8);
    } else listings = extractFromHtml(text, source, query);
    return {
      listings,
      status: {
        id: source.id,
        name: source.name,
        ok: true,
        count: listings.length,
        detail: listings.length ? `${listings.length} listing${listings.length > 1 ? "s" : ""} found` : "Page reachable, no products parsed",
        durationMs: Date.now() - started,
      },
    };
  } catch (err) {
    return {
      listings: [],
      status: {
        id: source.id,
        name: source.name,
        ok: false,
        count: 0,
        detail: err instanceof Error ? err.message.slice(0, 90) : "Source unavailable",
        durationMs: Date.now() - started,
      },
    };
  }
}

export async function scrapeAll(query: string, force = false): Promise<{ listings: ExternalListing[]; statuses: SourceStatus[]; cacheHit: boolean }> {
  if (process.env.ENABLE_LIVE_SCRAPING === "false") {
    return { listings: [], statuses: [], cacheHit: false };
  }
  const key = query.trim().toLowerCase();
  const cached = cache.get(key);
  if (!force && cached && Date.now() - cached.at < TTL) {
    return { ...cached, cacheHit: true };
  }
  const results = await Promise.all(SOURCES.map((s) => fetchSource(s, query)));
  const payload = {
    listings: results.flatMap((r) => r.listings).map((l) => ({ ...l, id: uid("live") })),
    statuses: results.map((r) => r.status),
    cacheHit: false,
  };
  cache.set(key, { at: Date.now(), listings: payload.listings, statuses: payload.statuses });
  return payload;
}

export function warmCacheStatuses(): SourceStatus[] {
  const all = new Map<string, SourceStatus>();
  cache.forEach((v) => v.statuses.forEach((s) => all.set(s.id, s)));
  return [...all.values()];
}
