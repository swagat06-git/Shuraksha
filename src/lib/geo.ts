import type { GeoPoint, Report, Resource, Severity, Suggestion } from "./types";

export const SEVERITY_WEIGHT: Record<Severity, number> = {
  low: 1,
  medium: 2.5,
  high: 5,
  critical: 8,
};

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

const TYPE_PREFERENCE: Record<Report["type"], Resource["type"][]> = {
  flood: ["ndrf", "shelter", "equipment", "supply"],
  cyclone: ["shelter", "ndrf", "supply", "equipment"],
  landslide: ["ndrf", "equipment", "shelter", "supply"],
  other: ["ndrf", "shelter", "supply", "equipment"],
};

/** Allocation engine: score = (1 / distance) * severity_weight, with type affinity. */
export function suggestAllocations(reports: Report[], resources: Resource[]): Suggestion[] {
  const open = reports.filter((r) => r.status === "pending");
  const available = resources.filter(
    (r) => r.status === "available" && r.availableCount > 0,
  );

  const suggestions: Suggestion[] = [];
  for (const report of open) {
    let best: Suggestion | null = null;
    for (const resource of available) {
      const distanceKm = Math.max(haversineKm(report.location, resource.location), 0.2);
      const prefIndex = TYPE_PREFERENCE[report.type].indexOf(resource.type);
      const affinity = prefIndex === -1 ? 0.5 : 1 - prefIndex * 0.15;
      const helpBoost = report.citizenStatus === "needs_help" ? 1.5 : 1;
      const score = (1 / distanceKm) * SEVERITY_WEIGHT[report.severity] * affinity * helpBoost;
      if (!best || score > best.score) best = { report, resource, distanceKm, score };
    }
    if (best) suggestions.push(best);
  }
  const PRIORITY: Record<Report["severity"], number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

return suggestions.sort((a, b) => {
  const severityDiff =
    PRIORITY[b.report.severity] - PRIORITY[a.report.severity];

  if (severityDiff !== 0) return severityDiff;

  return b.score - a.score;
});
}
