import { NextResponse } from "next/server";
import { interpretCommand } from "@/lib/ai";
import { adjustStock, getCatalog } from "@/lib/store";
import type { LanguageCode } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { text?: string; pharmacyId?: string | null; language?: LanguageCode; apply?: boolean };
    const text = (body.text ?? "").trim();
    if (!text || text.length > 400) return NextResponse.json({ error: "Command must be 1–400 characters" }, { status: 400 });
    const state = await getCatalog();
    let pharmacyId = body.pharmacyId ?? null;
    if (pharmacyId && !state.pharmacies.some((p) => p.id === pharmacyId)) pharmacyId = null;
    const result = await interpretCommand(text, pharmacyId, body.language ?? "en");
    if (result.understood && result.pharmacyId && body.apply !== false) {
      const { row, transaction, clamped } = await adjustStock({
        pharmacyId: result.pharmacyId,
        medicineId: result.medicineId!,
        delta: result.type === "sale" ? -result.quantity! : result.quantity!,
        type: result.type!,
        note: result.explanation,
        raw: text,
        source: "ai",
        confidence: result.confidence,
      });
      result.applied = {
        previous: row.quantity - transaction.delta,
        current: row.quantity,
        reorderLevel: row.reorderLevel,
        lowStock: row.quantity <= row.reorderLevel,
      };
      if (clamped) result.warnings.push("Not enough stock — quantity was clamped to zero.");
      if (result.applied.lowStock) result.warnings.push("This batch is now at or below its reorder level.");
    }
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Interpretation failed" }, { status: 500 });
  }
}
