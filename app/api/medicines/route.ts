import { NextResponse } from "next/server";
import { searchMedicines } from "@/lib/store";
import { scrapeAll } from "@/lib/scrapers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const city = url.searchParams.get("city") ?? undefined;
  const doScrape = url.searchParams.get("live") !== "0" && q.trim().length >= 2;
  const [medicines, scrape] = await Promise.all([
    searchMedicines(q, city),
    doScrape ? scrapeAll(q) : Promise.resolve({ listings: [], statuses: [], cacheHit: false }),
  ]);
  return NextResponse.json({
    medicines,
    liveListings: scrape.listings,
    sources: scrape.statuses,
    cacheHit: scrape.cacheHit,
    count: medicines.length,
  });
}
