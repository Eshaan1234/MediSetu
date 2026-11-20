import type { Pharmacy } from "./types";
import { haversineKm } from "./utils";

export type PlacesPharmacy = Pharmacy & { distanceKm?: number };

interface PlaceResult {
  place_id: string;
  name: string;
  vicinity?: string;
  rating?: number;
  geometry?: { location?: { lat: number; lng: number } };
  opening_hours?: { open_now?: boolean };
  business_status?: string;
  types?: string[];
}

const cache = new Map<string, { at: number; items: PlacesPharmacy[] }>();
const TTL = 30 * 60 * 1000;

export function placesKey(): string | null {
  return process.env.GOOGLE_PLACES_API_KEY || null;
}

export async function fetchGooglePharmacies(lat: number, lng: number, radius = 5000): Promise<PlacesPharmacy[]> {
  const key = placesKey();
  if (!key) return [];
  const cacheKey = `${lat.toFixed(2)}:${lng.toFixed(2)}:${radius}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < TTL) return cached.items;

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
    url.searchParams.set("location", `${lat},${lng}`);
    url.searchParams.set("radius", String(radius));
    url.searchParams.set("type", "pharmacy");
    url.searchParams.set("key", key);
    const res = await fetch(url, { signal: AbortSignal.timeout(9000), cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { results?: PlaceResult[]; status?: string };
    const items = (json.results ?? [])
      .map((p): PlacesPharmacy | null => {
        const pLat = p.geometry?.location?.lat;
        const pLng = p.geometry?.location?.lng;
        if (pLat == null || pLng == null) return null;
        return {
          id: `gplaces-${p.place_id}`,
          name: p.name,
          chain: "Google Places",
          address: p.vicinity || "Address not listed",
          city: p.vicinity?.split(",").slice(-1)[0]?.trim() || "Nearby",
          state: "",
          pincode: "",
          lat: pLat,
          lng: pLng,
          phone: "",
          hours: p.opening_hours?.open_now ? "Open now" : "Hours not listed",
          rating: p.rating ?? 0,
          delivery: false,
          source: "live",
          distanceKm: haversineKm(lat, lng, pLat, pLng),
        };
      })
      .filter((x): x is PlacesPharmacy => x !== null)
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
      .slice(0, 120);
    cache.set(cacheKey, { at: Date.now(), items });
    return items;
  } catch (err) {
    console.warn("[places] lookup failed:", err instanceof Error ? err.message : err);
    return [];
  }
}
