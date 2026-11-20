import { NextResponse } from "next/server";
import { scrapeAll } from "@/lib/scrapers";
import { getCatalog, setListings } from "@/lib/store";
import type { ExternalListing, SourceStatus } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  const queries = ["dolo 650", "paracetamol", "pantoprazole 40", "azithromycin 500"];
  const results = await Promise.all(queries.map((q) => scrapeAll(q, true)));
  const statuses = results[0]?.statuses ?? [];
  const bySource = new Map<string, SourceStatus>();
  statuses.forEach((s) => bySource.set(s.id, s));
  const listings: ExternalListing[] = [];
  const seen = new Set<string>();
  results.forEach((r) =>
    r.listings.forEach((l) => {
      const key = `${l.source}:${l.name}:${l.price}`;
      if (seen.has(key)) return;
      seen.add(key);
      listings.push(l);
    }),
  );
  await setListings(listings, [...bySource.values()]);
  const state = await getCatalog();
  return NextResponse.json({
    listings,
    statuses: [...bySource.values()],
    total: listings.length,
    scanned: queries.length,
    cachedListings: state.listings.length,
  });
}
