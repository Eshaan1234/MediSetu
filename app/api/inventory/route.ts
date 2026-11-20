import { NextResponse } from "next/server";
import { adjustStock, getCatalog, getInventory } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const pharmacyId = new URL(req.url).searchParams.get("pharmacyId") ?? undefined;
  return NextResponse.json({ stock: await getInventory(pharmacyId) });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { pharmacyId?: string; medicineId?: string; delta?: number; note?: string };
    if (!body.pharmacyId || !body.medicineId || typeof body.delta !== "number") {
      return NextResponse.json({ error: "pharmacyId, medicineId and delta are required" }, { status: 400 });
    }
    const type = body.delta < 0 ? "sale" : "purchase";
    const result = await adjustStock({ ...body, pharmacyId: body.pharmacyId, medicineId: body.medicineId, delta: body.delta, type });
    return NextResponse.json(result);
  } catch (err) {
    const state = await getCatalog();
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid request", medicines: state.medicines.map((m) => m.id) },
      { status: 400 },
    );
  }
}
