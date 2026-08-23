import { Suspense, lazy } from "react";

import { ClientOnly } from "@/components/ClientOnly";
import { Skeleton } from "@/components/ui/skeleton";
import type { MapCanvasProps } from "@/components/MapCanvas";

const MapCanvas = lazy(() => import("@/components/MapCanvas"));

function MapSkeleton() {
  return <Skeleton className="h-full w-full rounded-none" />;
}

export function IncidentMap(props: MapCanvasProps) {
  return (
    <ClientOnly fallback={<MapSkeleton />}>
      <Suspense fallback={<MapSkeleton />}>
        <MapCanvas {...props} />
      </Suspense>
    </ClientOnly>
  );
}
