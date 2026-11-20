import type { Pharmacy } from "./types";
import { haversineKm } from "./utils";

export type OsmPharmacy = Pharmacy & { distanceKm?: number };

const cache = new Map<string, { at: number; items: OsmPharmacy[] }>();
const TTL = 30 * 60 * 1000;
const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

interface OsmElement {
  type: string;
  id: number;
  lat?: number;
  lng?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export async function fetchOsmPharmacies(lat: number, lng: number, radius = 5000): Promise<OsmPharmacy[]> {
  const key = `${lat.toFixed(2)}:${lng.toFixed(2)}:${radius}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < TTL) return cached.items;

  const query =
    `[out:json][timeout:18];(` +
    `node["amenity"="pharmacy"](around:${radius},${lat},${lng});` +
    `way["amenity"="pharmacy"](around:${radius},${lat},${lng});` +
    `relation["amenity"="pharmacy"](around:${radius},${lat},${lng});` +
    `);out center tags;`;

  let elements: OsmElement[] = [];
  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "User-Agent": "MediSetu/1.0 (medicine finder demo)",
          Accept: "application/json",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(7000),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { elements?: OsmElement[] };
      elements = json.elements ?? [];
      break;
    } catch (err) {
      console.warn("[osm] endpoint failed, trying next:", err instanceof Error ? err.message : err);
    }
  }

  const items: OsmPharmacy[] = elements
    .map((e): OsmPharmacy | null => {
      const eLat = e.lat ?? e.center?.lat;
      const eLng = e.lng ?? e.center?.lon;
      const tags = e.tags ?? {};
      if (eLat == null || eLng == null) return null;
      const name = tags.name || tags.brand || "Pharmacy";
      const city = tags["addr:city"] || tags["addr:town"] || tags["addr:village"] || "Nearby";
      const street = tags["addr:street"] || tags["addr:suburb"] || "";
      return {
        id: `osm-${e.type}-${e.id}`,
        name: name.slice(0, 90),
        chain: "OpenStreetMap",
        address: (street ? `${street}, ` : "") + city,
        city,
        state: tags["addr:state"] || "",
        pincode: tags["addr:postcode"] || "",
        lat: eLat,
        lng: eLng,
        phone: tags.phone || tags["contact:phone"] || "",
        hours: tags.opening_hours || "Hours not listed",
        rating: 0,
        delivery: false,
        source: "live" as const,
        distanceKm: haversineKm(lat, lng, eLat, eLng),
      };
    })
    .filter((x): x is OsmPharmacy => x !== null)
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
    .slice(0, 120);

  // Retry empty results sooner than successful ones (public Overpass mirrors throttle).
  cache.set(key, { at: items.length ? Date.now() : Date.now() - (TTL - 5 * 60 * 1000), items });
  return items;
}
