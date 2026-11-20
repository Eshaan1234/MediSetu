import { NextResponse } from "next/server";
import { getTransactions } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const limit = Math.min(200, Math.max(1, Number(u.searchParams.get("limit")) || 40));
  return NextResponse.json({ transactions: await getTransactions(u.searchParams.get("pharmacyId") ?? undefined, limit) });
}
