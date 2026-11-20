"use client";

import dynamic from "next/dynamic";
import { MapPinned } from "lucide-react";
import type { PharmacyHit } from "@/lib/store";

const GoogleMapsMap = dynamic(() => import("./GoogleMapsMap"), {
  ssr: false,
  loading: () => <MapSkeleton label="Loading Google Maps…" />,
});
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <MapSkeleton label="Loading map…" />,
});

function MapSkeleton({ label }: { label: string }) {
  return (
    <div className="grid h-full min-h-[420px] w-full place-items-center rounded-2xl border border-white/[0.07] bg-[#0a1220]">
      <div className="text-center text-slate-500">
        <MapPinned className="mx-auto mb-3 h-8 w-8 animate-pulse text-mint" />
        <span className="text-xs">{label}</span>
      </div>
    </div>
  );
}

export function MapPanel({
  pharmacies,
  selectedId,
  onSelect,
  center,
  mode,
}: {
  pharmacies: PharmacyHit[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  center: [number, number];
  mode: "google" | "openstreetmap";
}) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (mode === "google" && key) {
    return <GoogleMapsMap pharmacies={pharmacies} selectedId={selectedId} onSelect={onSelect} center={center} apiKey={key} />;
  }
  return <LeafletMap pharmacies={pharmacies} selectedId={selectedId} onSelect={onSelect} center={center} />;
}
