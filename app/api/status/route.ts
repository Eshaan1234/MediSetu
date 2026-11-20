import { NextResponse } from "next/server";
import { getCatalog, storageMode } from "@/lib/store";
import { SOURCES } from "@/lib/scrapers";
import { placesKey } from "@/lib/places";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = await getCatalog();
  return NextResponse.json({
    maps: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? "google" : "openstreetmap",
    places: Boolean(placesKey()),
    ai: process.env.OPENAI_API_KEY ? "openai" : "local",
    storage: await storageMode(),
    scraping: process.env.ENABLE_LIVE_SCRAPING === "false" ? "disabled" : "enabled",
    sources: SOURCES.map((s) => s.name),
    sourceStatuses: state.sourceStatuses,
    liveListings: state.listings.length,
    medicines: state.medicines.length,
    pharmacies: state.pharmacies.length,
  });
}
