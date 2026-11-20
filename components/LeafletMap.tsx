"use client";

import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { PharmacyHit } from "@/lib/store";
import { inr } from "@/lib/utils";

function icon(active: boolean) {
  return L.divIcon({
    className: "map-pin",
    html: `<div class="pin-body ${active ? "active" : ""}"><span>✚</span></div>`,
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -38],
  });
}

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, 12, { duration: 1.1 }); }, [center[0], center[1], map]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function LeafletMap({
  pharmacies,
  selectedId,
  onSelect,
  center,
}: {
  pharmacies: PharmacyHit[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  center: [number, number];
}) {
  const refs = useRef<Record<string, L.Marker | null>>({});
  const icons = useMemo(() => ({ active: icon(true), normal: icon(false) }), []);

  useEffect(() => {
    if (selectedId && refs.current[selectedId]) refs.current[selectedId]?.openPopup();
  }, [selectedId]);

  return (
    <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full min-h-[420px] w-full rounded-2xl" style={{ background: "#0a1220" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <Recenter center={center} />
      {pharmacies.slice(0, 120).map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={selectedId === p.id ? icons.active : icons.normal}
          eventHandlers={{ click: () => onSelect(p.id) }}
          ref={(el) => { refs.current[p.id] = el; }}
        >
          <Popup>
            <div className="min-w-[190px] p-1 text-slate-900">
              <div className="text-sm font-bold text-slate-900">{p.name}</div>
              <div className="mt-1 text-[11px] text-slate-600">{p.address}, {p.city}</div>
              <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold">
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-700">★ {p.rating}</span>
                {p.price != null && <span className="text-slate-800">{inr(p.price)}</span>}
                {p.stock && <span className={p.stock.quantity > 0 ? "text-emerald-700" : "text-rose-600"}>{p.stock.quantity} left</span>}
              </div>
              <a
                className="mt-2 block text-[11px] font-semibold text-emerald-700"
                href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`}
                target="_blank"
                rel="noreferrer"
              >
                Get directions →
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
