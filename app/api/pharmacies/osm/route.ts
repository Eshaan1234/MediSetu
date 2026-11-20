import { NextResponse } from "next/server";
import { fetchOsmPharmacies } from "@/lib/osm";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req: Request) {
  const u = new URL(req.url);
  const lat = Number(u.searchParams.get("lat"));
  const lng = Number(u.searchParams.get("lng"));
  const radius = Math.min(25000, Math.max(1000, Number(u.searchParams.get("radius")) || 5000));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }
  const pharmacies = await fetchOsmPharmacies(lat, lng, radius);
  return NextResponse.json({ pharmacies, count: pharmacies.length, source: "OpenStreetMap" });
}
