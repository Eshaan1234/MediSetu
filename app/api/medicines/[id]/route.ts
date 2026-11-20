import { NextResponse } from "next/server";
import { findMedicineById, getCatalog, searchMedicines } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const medicine = await findMedicineById(params.id);
  if (!medicine) return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
  const state = await getCatalog();
  const stock = state.stock
    .filter((s) => s.medicineId === params.id)
    .map((s) => ({ ...s, pharmacy: state.pharmacies.find((p) => p.id === s.pharmacyId)! }))
    .filter((s) => s.pharmacy)
    .sort((a, b) => a.price - b.price);
  const alternatives = await searchMedicines(medicine.salt);
  return NextResponse.json({
    medicine,
    stock,
    alternatives: alternatives.filter((a) => a.id !== medicine.id).slice(0, 4),
  });
}
