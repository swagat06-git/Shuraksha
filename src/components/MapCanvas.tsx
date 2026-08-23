import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";

import { CENTER } from "@/lib/mock-data";
import type { GeoPoint, Report, Resource } from "@/lib/types";

const SEVERITY_VAR: Record<Report["severity"], string> = {
  low: "var(--sev-low)",
  medium: "var(--sev-medium)",
  high: "var(--sev-high)",
  critical: "var(--sev-critical)",
};

const RESOURCE_GLYPH: Record<Resource["type"], string> = {
  shelter: "S",
  ndrf: "N",
  supply: "P",
  equipment: "E",
};

function dot(color: string, glyph: string, size: number) {
  return L.divIcon({
    className: "",
    html: `<div class="shuraksha-marker" style="width:${size}px;height:${size}px;background:${color}">${glyph}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function ClickHandler({ onPick }: { onPick: (p: GeoPoint) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function SizeFix() {
  const map = useMap();
  useEffect(() => {
    const fix = () => map.invalidateSize();
    const t = window.setTimeout(fix, 120);
    window.addEventListener("resize", fix);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", fix);
    };
  }, [map]);
  return null;
}

function Recenter({ point }: { point: GeoPoint | null }) {
  const map = useMap();
  useEffect(() => {
    if (point) map.flyTo([point.lat, point.lng], Math.max(map.getZoom(), 14), { duration: 0.6 });
  }, [point, map]);
  return null;
}

export interface MapCanvasProps {
  reports?: Report[];
  resources?: Resource[];
  pin?: GeoPoint | null;
  focus?: GeoPoint | null;
  onPick?: (p: GeoPoint) => void;
  onSelectReport?: (id: string) => void;
  zoom?: number;
}

export default function MapCanvas({
  reports = [],
  resources = [],
  pin = null,
  focus = null,
  onPick,
  onSelectReport,
  zoom = 12,
}: MapCanvasProps) {
  return (
    <MapContainer
      center={[CENTER.lat, CENTER.lng]}
      zoom={zoom}
      scrollWheelZoom
      className="h-full w-full"
      preferCanvas
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {onPick ? <ClickHandler onPick={onPick} /> : null}
      <Recenter point={focus ?? pin} />

      {resources.map((r) => (
        <Marker
          key={r.id}
          position={[r.location.lat, r.location.lng]}
          icon={dot("var(--navy)", RESOURCE_GLYPH[r.type], 24)}
        >
          <Popup>
            <strong>{r.name}</strong>
            <br />
            {r.address}
            <br />
            Available: {r.availableCount}/{r.capacity}
          </Popup>
        </Marker>
      ))}

      {reports.map((r) => (
        <Marker
          key={r.id}
          position={[r.location.lat, r.location.lng]}
          icon={dot(SEVERITY_VAR[r.severity], "!", r.severity === "critical" ? 30 : 24)}
          eventHandlers={{ click: () => onSelectReport?.(r.id) }}
        >
          <Popup>
            <strong className="capitalize">{r.type}</strong> · {r.severity} ({r.severityScore})
            <br />
            {r.address}
            <br />
            {r.description}
          </Popup>
        </Marker>
      ))}

      {pin ? (
        <Marker position={[pin.lat, pin.lng]} icon={dot("var(--rescue)", "◎", 30)}>
          <Popup>Your selected location</Popup>
        </Marker>
      ) : null}
    </MapContainer>
  );
}
