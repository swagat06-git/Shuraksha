import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import * as db from "@/services/firebase";
import { SEED_REPORTS, SEED_RESOURCES } from "@/lib/mock-data";
import type { AppUser, Report, Resource } from "@/lib/types";

interface StoreValue {
  reports: Report[];
  resources: Resource[];
  user: AppUser | null;
  ready: boolean;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<Report[]>(SEED_REPORTS);
  const [resources, setResources] = useState<Resource[]>(SEED_RESOURCES);
  const [user, setUser] = useState<AppUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const u1 = db.subscribeReports(setReports);
    const u2 = db.subscribeResources(setResources);
    const u3 = db.subscribeAuth(setUser);
    setReady(true);
    return () => {
      u1();
      u2();
      u3();
    };
  }, []);

  const value = useMemo(
    () => ({ reports, resources, user, ready }),
    [reports, resources, user, ready],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
