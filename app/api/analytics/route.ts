import { NextResponse } from "next/server";
import { getAnalytics } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const pharmacyId = new URL(req.url).searchParams.get("pharmacyId") ?? undefined;
  return NextResponse.json(await getAnalytics(pharmacyId));
}
