"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import type { PharmacyHit } from "@/lib/store";

const DARK_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#101a2c" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a1120" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#93a4bd" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0b1c30" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1b2940" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
];

const pinSvg = (active: boolean) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="52" viewBox="0 0 42 52"><path d="M21 2C10.5 2 2 10.4 2 21c0 14 19 29 19 29s19-15 19-29C40 10.4 31.5 2 21 2z" fill="${active ? "#fbbf24" : "#34e2b0"}" stroke="#07101e" stroke-width="2"/><circle cx="21" cy="21" r="8" fill="#07101e"/><path d="M21 15v12M15 21h12" stroke="${active ? "#fbbf24" : "#34e2b0"}" stroke-width="3" stroke-linecap="round"/></svg>`,
  )}`;

export default function GoogleMapsMap({
  pharmacies,
  selectedId,
  onSelect,
  center,
  apiKey,
}: {
  pharmacies: PharmacyHit[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  center: [number, number];
  apiKey: string;
}) {
  const el = useRef<HTMLDivElement | null>(null);
  const map = useRef<any>(null);
  const markers = useRef<Record<string, any>>({});
  const windows = useRef<Record<string, any>>({});
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);
  onSelectRef.current = onSelect;

  useEffect(() => {
    let cancelled = false;
    const loader = new Loader({ apiKey, version: "weekly" });
    loader.load().then(() => {
      if (cancelled || !el.current) return;
      const g = (window as any).google;
      map.current = new g.maps.Map(el.current, {
        center: { lat: center[0], lng: center[1] },
        zoom: 12,
        styles: DARK_STYLES,
        disableDefaultUI: false,
        clickableIcons: false,
        gestureHandling: "cooperative",
        mapTypeControl: false,
        streetViewControl: false,
      });
      setReady(true);
    }).catch(() => setReady(false));
    return () => { cancelled = true; };
  }, [apiKey]);

  useEffect(() => {
    if (!ready || !map.current) return;
    const g = (window as any).google;
    Object.values(markers.current).forEach((m: any) => m.setMap(null));
    markers.current = {};
    windows.current = {};
    pharmacies.slice(0, 120).forEach((p) => {
      const marker = new g.maps.Marker({
        position: { lat: p.lat, lng: p.lng },
        map: map.current,
        title: p.name,
        icon: { url: pinSvg(selectedId === p.id), scaledSize: new g.maps.Size(42, 52), anchor: new g.maps.Point(21, 52) },
      });
      const stock = p.stock ? `<div style="margin-top:6px;font-size:11px;color:${p.stock.quantity > 0 ? "#34e2b0" : "#fb7185"}">${p.stock.quantity} units · ₹${p.price ?? p.stock.price}</div>` : "";
      const info = new g.maps.InfoWindow({
        content: `<div style="min-width:190px;padding:4px;font-family:system-ui"><div style="font-weight:700;color:#fff;font-size:13px">${p.name}</div><div style="margin-top:4px;font-size:11px;color:#9fb2cc">${p.address}, ${p.city}</div>${stock}<a style="display:inline-block;margin-top:8px;font-size:11px;color:#34e2b0" href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}" target="_blank" rel="noreferrer">Directions →</a></div>`,
      });
      marker.addListener("click", () => onSelectRef.current(p.id));
      markers.current[p.id] = marker;
      windows.current[p.id] = info;
    });
    return () => {
      Object.values(markers.current).forEach((m: any) => m.setMap(null));
    };
  }, [ready, pharmacies, selectedId]);

  useEffect(() => {
    if (!ready || !map.current) return;
    const g = (window as any).google;
    if (selectedId && markers.current[selectedId]) {
      map.current.panTo(markers.current[selectedId].getPosition());
      windows.current[selectedId]?.open(map.current, markers.current[selectedId]);
    }
    map.current.setCenter({ lat: center[0], lng: center[1] });
  }, [selectedId, center[0], center[1], ready]);

  return <div ref={el} className="h-full min-h-[420px] w-full rounded-2xl" style={{ background: "#101a2c" }} />;
}
