export type Severity = "low" | "medium" | "high" | "critical";
export type ReportType = "flood" | "cyclone" | "landslide" | "other";
export type ReportStatus = "pending" | "assigned" | "en_route" | "resolved";
export type ReportSource = "app" | "sms" | "ivr";
export type ResourceType = "shelter" | "ndrf" | "supply" | "equipment";
export type ResourceStatus = "available" | "deployed" | "depleted";
export type UserRole = "citizen" | "authority" | "admin";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Report {
  id: string;
  userId: string | null;
  source: ReportSource;
  location: GeoPoint;
  address: string;
  type: ReportType;
  description: string;
  photoUrl?: string;
  severity: Severity;
  severityScore: number;
  hazardType: string;
  peopleAffected: string;
  status: ReportStatus;
  assignedResourceId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Resource {
  id: string;
  type: ResourceType;
  name: string;
  location: GeoPoint;
  address: string;
  capacity: number;
  availableCount: number;
  status: ResourceStatus;
}

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
  phone?: string;
}

export interface Suggestion {
  report: Report;
  resource: Resource;
  distanceKm: number;
  score: number;
}
