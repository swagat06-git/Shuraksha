/**
 * Firebase-shaped data layer with an in-memory mock implementation.
 *
 * Every function here mirrors the call it will make once Firebase is wired:
 *   subscribeReports  -> onSnapshot(collection(db, "reports"))
 *   createReport      -> addDoc(collection(db, "reports"), data)
 *   updateReport      -> updateDoc(doc(db, "reports", id), data)
 *   signIn/signUp     -> signInWithEmailAndPassword / createUserWithEmailAndPassword
 *
 * Replace the bodies only — the exported signatures stay identical.
 */
import { SEED_REPORTS, SEED_RESOURCES } from "@/lib/mock-data";
import { scoreSeverity } from "@/lib/severity";
import type { AppUser, Report, Resource, UserRole } from "@/lib/types";

type Listener<T> = (value: T) => void;

const STORAGE_KEY = "shuraksha.state.v1";
const AUTH_KEY = "shuraksha.auth.v1";

interface DbState {
  reports: Report[];
  resources: Resource[];
}

let state: DbState = { reports: SEED_REPORTS, resources: SEED_RESOURCES };
let hydrated = false;

const reportListeners = new Set<Listener<Report[]>>();
const resourceListeners = new Set<Listener<Resource[]>>();
const authListeners = new Set<Listener<AppUser | null>>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) state = JSON.parse(raw) as DbState;
  } catch {
    /* keep seed data */
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or unavailable */
  }
}

function emit() {
  persist();
  reportListeners.forEach((l) => l(state.reports));
  resourceListeners.forEach((l) => l(state.resources));
}

/* ---------------------------------------------------------------- reports */

export function subscribeReports(cb: Listener<Report[]>): () => void {
  hydrate();
  reportListeners.add(cb);
  cb(state.reports);
  return () => reportListeners.delete(cb);
}

export function subscribeResources(cb: Listener<Resource[]>): () => void {
  hydrate();
  resourceListeners.add(cb);
  cb(state.resources);
  return () => resourceListeners.delete(cb);
}

export interface NewReportInput {
  userId: string | null;
  source: Report["source"];
  location: Report["location"];
  address: string;
  type: Report["type"];
  description: string;
  photoUrl?: string;
}

/** Writes the report, then applies severity scoring (the Cloud Function step). */
export async function createReport(input: NewReportInput): Promise<Report> {
  hydrate();
  const ts = Date.now();
  const scored = scoreSeverity(input.description, input.type);
  const report: Report = {
    id: `rep-${ts}`,
    ...input,
    ...scored,
    status: "pending",
    createdAt: ts,
    updatedAt: ts,
  };
  state = { ...state, reports: [report, ...state.reports] };
  emit();
  return report;
}

export async function updateReport(id: string, patch: Partial<Report>): Promise<void> {
  state = {
    ...state,
    reports: state.reports.map((r) =>
      r.id === id ? { ...r, ...patch, updatedAt: Date.now() } : r,
    ),
  };
  emit();
}

/* -------------------------------------------------------------- resources */

export async function updateResource(id: string, patch: Partial<Resource>): Promise<void> {
  state = {
    ...state,
    resources: state.resources.map((r) => (r.id === id ? { ...r, ...patch } : r)),
  };
  emit();
}

/** Dispatch: consumes one unit of the resource and moves the report to en route. */
export async function dispatchResource(reportId: string, resourceId: string): Promise<void> {
  const resource = state.resources.find((r) => r.id === resourceId);
  if (!resource) return;
  const availableCount = Math.max(0, resource.availableCount - 1);
  await updateResource(resourceId, {
    availableCount,
    status: availableCount === 0 ? "depleted" : "deployed",
  });
  await updateReport(reportId, { status: "en_route", assignedResourceId: resourceId });
}

export async function resetDemoData(): Promise<void> {
  state = { reports: SEED_REPORTS, resources: SEED_RESOURCES };
  emit();
}

/* ------------------------------------------------------------------- auth */

export function subscribeAuth(cb: Listener<AppUser | null>): () => void {
  authListeners.add(cb);
  cb(getCurrentUser());
  return () => authListeners.delete(cb);
}

export function getCurrentUser(): AppUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as AppUser) : null;
  } catch {
    return null;
  }
}

function setUser(user: AppUser | null) {
  if (typeof window !== "undefined") {
    if (user) window.localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    else window.localStorage.removeItem(AUTH_KEY);
  }
  authListeners.forEach((l) => l(user));
}

export async function signIn(email: string, role: UserRole): Promise<AppUser> {
  const user: AppUser = {
    uid: `usr-${role}`,
    email,
    role,
    displayName: email.split("@")[0] || "User",
  };
  setUser(user);
  return user;
}

export async function signUp(
  email: string,
  displayName: string,
  role: UserRole,
): Promise<AppUser> {
  const user: AppUser = { uid: `usr-${role}`, email, role, displayName };
  setUser(user);
  return user;
}

export async function signInWithGoogle(role: UserRole): Promise<AppUser> {
  return signIn(`demo.${role}@shuraksha.in`, role);
}

export async function signOut(): Promise<void> {
  setUser(null);
}
