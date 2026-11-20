import { NextResponse } from "next/server";
import { findPharmacies } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const lat = Number(u.searchParams.get("lat"));
  const lng = Number(u.searchParams.get("lng"));
  const pharmacies = await findPharmacies({
    query: u.searchParams.get("q") ?? undefined,
    city: u.searchParams.get("city") ?? undefined,
    medicineId: u.searchParams.get("medicineId") ?? undefined,
    inStockOnly: u.searchParams.get("inStockOnly") === "true",
    lat: Number.isFinite(lat) && u.searchParams.has("lat") ? lat : undefined,
    lng: Number.isFinite(lng) && u.searchParams.has("lng") ? lng : undefined,
  });
  return NextResponse.json({ pharmacies, count: pharmacies.length });
}
