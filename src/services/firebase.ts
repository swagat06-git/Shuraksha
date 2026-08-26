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

import { auth, db } from "@/services/firebase-client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";



import { doc, getDoc, setDoc } from "firebase/firestore";

import { SEED_REPORTS, SEED_RESOURCES } from "@/lib/mock-data";

import { scoreSeverityWithFallback } from "@/lib/severity";

import type { AppUser, Report, Resource, UserRole } from "@/lib/types";

type Listener<T> = (value: T) => void;

const STORAGE_KEY = "shuraksha.state.v1";
const AUTH_KEY = "shuraksha.auth.v1";

interface DbState {
  reports: Report[];
  resources: Resource[];
}

const serverState = globalThis as typeof globalThis & {
  __shurakshaState?: DbState;
};

let state: DbState =
  serverState.__shurakshaState ?? {
    reports: SEED_REPORTS,
    resources: SEED_RESOURCES,
  };

serverState.__shurakshaState = state;
let hydrated = false;

const reportListeners = new Set<Listener<Report[]>>();
const resourceListeners = new Set<Listener<Resource[]>>();
const authListeners = new Set<Listener<AppUser | null>>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;

  hydrated = true;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (raw) {
      const localState = JSON.parse(raw) as DbState;

      state = {
        reports: localState.reports ?? state.reports,
        resources: localState.resources ?? state.resources,
      };
    }

    serverState.__shurakshaState = state;
  } catch {
    /* keep server state */
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
  serverState.__shurakshaState = state;
  persist();

  reportListeners.forEach((l) => l(state.reports));
  resourceListeners.forEach((l) => l(state.resources));
}

/* ---------------------------------------------------------------- reports */
export function getReports(): Report[] {
  hydrate();
  return state.reports;
}

export function subscribeReports(cb: Listener<Report[]>): () => void {
  hydrate();

  reportListeners.add(cb);
  cb(state.reports);

  if (typeof window !== "undefined") {
    void fetch(`/api/public/reports?t=${Date.now()}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) return;

        const reports = (await response.json()) as Report[];

        state = {
          ...state,
          reports: reports.length > 0 ? reports : SEED_REPORTS,
        };

        persist();
        cb(state.reports);
      })
      .catch(() => {
        // Keep the existing local state if the server is unavailable.
      });
  }

  return () => reportListeners.delete(cb);
}

export function subscribeResources(cb: Listener<Resource[]>): () => void {
  hydrate();

  resourceListeners.add(cb);
  cb(state.resources);

  if (typeof window !== "undefined") {
    void fetch(`/api/public/resources?t=${Date.now()}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) return;

        const resources = (await response.json()) as Resource[];

        state = {
          ...state,
          resources,
        };

        persist();
        cb(state.resources);
      })
      .catch(() => {
        // Keep the existing local state if the server is unavailable.
      });
  }

  return () => resourceListeners.delete(cb);
}

export interface NewReportInput {
  userId: string | null;
  source: Report["source"];
  location: Report["location"];
  address: string;
  type: Report["type"];
  description: string;
  photoFile?: File;
  phone?: string;
}

/** Writes the report, then applies severity scoring (the Cloud Function step). */
export async function createReport(input: NewReportInput): Promise<Report> {
  hydrate();

  const ts = Date.now();

  const scored = await scoreSeverityWithFallback(
    input.description,
    input.type,
  );

  const { photoFile, ...reportInput } = input;

  const report: Report = {
    id: `rep-${ts}`,
    ...reportInput,
    ...scored,
    status: "pending",
    citizenStatus: "needs_help",
    createdAt: ts,
    updatedAt: ts,
  };

  if (typeof window !== "undefined") {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("You must be signed in to submit a report.");
    }

    const idToken = await currentUser.getIdToken();

    const formData = new FormData();

    formData.append("report", JSON.stringify(report));

    if (photoFile) {
      formData.append("photo", photoFile);
    }

    const response = await fetch("/api/public/reports", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to save report to the server.");
    }

    const savedReport = (await response.json()) as Report;

    state = {
      ...state,
      reports: [savedReport, ...state.reports],
    };

    persist();
    emit();

    return savedReport;
  }

  state = {
    ...state,
    reports: [report, ...state.reports],
  };

  emit();

  return report;
}

export async function updateReport(
  id: string,
  patch: Partial<Report>,
): Promise<void> {
  const updatedAt = Date.now();

  if (typeof window !== "undefined") {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("You must be signed in to update a report.");
    }

    const idToken = await currentUser.getIdToken();

    const response = await fetch("/api/public/reports", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        id,
        patch,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to update report on the server.");
    }
  }

  state = {
    ...state,
    reports: state.reports.map((r) =>
      r.id === id ? { ...r, ...patch, updatedAt } : r,
    ),
  };

  emit();
}
/* -------------------------------------------------------------- resources */

export async function updateResource(
  id: string,
  patch: Partial<Resource>,
): Promise<void> {
  if (typeof window !== "undefined") {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("You must be signed in to update a resource.");
    }

    const idToken = await currentUser.getIdToken();

    const response = await fetch("/api/public/resources", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        id,
        patch,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to update resource on the server.");
    }
  }

  const updatedAt = Date.now();

  state = {
    ...state,
    resources: state.resources.map((r) =>
      r.id === id ? { ...r, ...patch, updatedAt } : r,
    ),
  };

  emit();
}

/** Dispatch: consumes one unit of the resource and moves the report to en route. */
export async function dispatchResource(
  reportId: string,
  resourceId: string,
): Promise<void> {
  const resource = state.resources.find((r) => r.id === resourceId);

  if (!resource || resource.availableCount <= 0) {
    return;
  }

  const availableCount = Math.max(0, resource.availableCount - 1);

  await updateResource(resourceId, {
    availableCount,
    status: availableCount === 0 ? "depleted" : "deployed",
  });

  if (resource.type === "evacuation") {
    await updateReport(reportId, {
      status: "en_route",
      assignedEvacuationResourceId: resourceId,
    });
  } else {
    await updateReport(reportId, {
      status: "en_route",
      assignedResourceId: resourceId,
    });
  }
}

export async function resolveReport(reportId: string): Promise<void> {
  const report = state.reports.find((r) => r.id === reportId);

  if (!report) return;

  const resourceIds = [
    report.assignedResourceId,
    report.assignedEvacuationResourceId,
  ].filter((id): id is string => Boolean(id));

  for (const resourceId of resourceIds) {
    const resource = state.resources.find((r) => r.id === resourceId);

    if (resource) {
      const availableCount = Math.min(
        resource.capacity,
        resource.availableCount + 1,
      );

      await updateResource(resourceId, {
        availableCount,
        status: "available",
      });
    }
  }

  await updateReport(reportId, {
    status: "resolved",
    citizenStatus: "safe",
  });
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



export async function signIn(
  email: string,
  password: string,
  role: UserRole,
): Promise<AppUser> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const firebaseUser = credential.user;

  const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

  const storedRole = userDoc.exists()
    ? (userDoc.data()["role"] as UserRole)
    : role;

  const displayName =
    userDoc.exists() && typeof userDoc.data()["displayName"] === "string"
      ? userDoc.data()["displayName"]
      : firebaseUser.displayName || email.split("@")[0] || "User";

  const user: AppUser = {
    uid: firebaseUser.uid,
    email: firebaseUser.email || email,
    role: storedRole,
    displayName,
  };

  setUser(user);
  return user;
}

export async function signUp(
  email: string,
  password: string,
  displayName: string,
  role: UserRole,
  phone: string,
): Promise<AppUser> {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );

  const firebaseUser = credential.user;

  const user: AppUser = {
    uid: firebaseUser.uid,
    email: firebaseUser.email || email,
    role,
    displayName,
  };

  await setDoc(doc(db, "users", firebaseUser.uid), {
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    phone: phone.trim(),
    createdAt: Date.now(),
  });

  setUser(user);
  return user;
}

export async function getUserPhone(userId: string): Promise<string | null> {
  if (!userId) return null;

  const userDoc = await getDoc(doc(db, "users", userId));

  if (!userDoc.exists()) {
    return null;
  }

  const phone = userDoc.data()["phone"];

  return typeof phone === "string" && phone.trim()
    ? phone.trim()
    : null;
}

export async function signInWithGoogle(
  role: UserRole,
): Promise<AppUser> {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  const firebaseUser = credential.user;

  const userRef = doc(db, "users", firebaseUser.uid);
  const userDoc = await getDoc(userRef);

  const storedRole = userDoc.exists()
    ? (userDoc.data()["role"] as UserRole)
    : role;

  const displayName =
    userDoc.exists() &&
      typeof userDoc.data()["displayName"] === "string"
      ? userDoc.data()["displayName"]
      : firebaseUser.displayName || "User";

  const user: AppUser = {
    uid: firebaseUser.uid,
    email: firebaseUser.email || "",
    role: storedRole,
    displayName,
  };

  if (!userDoc.exists()) {
    await setDoc(userRef, {
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      createdAt: Date.now(),
    });
  }

  setUser(user);
  return user;
}

export async function signOut(): Promise<void> {
  setUser(null);
}
