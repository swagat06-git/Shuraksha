import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, RotateCcw, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { IncidentMap } from "@/components/IncidentMap";
import { SeverityBadge, StatusBadge } from "@/components/SeverityBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { haversineKm, suggestAllocations } from "@/lib/geo";
import { useStore } from "@/lib/store";
import type { GeoPoint, Resource } from "@/lib/types";
import * as db from "@/services/firebase";

export const Route = createFileRoute("/authority")({
  head: () => ({
    meta: [
      { title: "Authority operations console — Shuraksha" },
      {
        name: "description",
        content: "Live incident map, severity triage and one-click resource dispatch for response authorities.",
      },
      { property: "og:title", content: "Authority operations console — Shuraksha" },
      { property: "og:description", content: "Coordinate NDRF teams, shelters and supplies from a single live map." },
    ],
  }),
  component: AuthorityConsole,
});

function AuthorityConsole() {
  const { reports, resources } = useStore();
  const [focus, setFocus] = useState<GeoPoint | null>(null);

  const openReports = useMemo(() => reports.filter((r) => r.status !== "resolved"), [reports]);
  const suggestions = useMemo(() => suggestAllocations(reports, resources), [reports, resources]);
  const critical = openReports.filter((r) => r.severity === "critical").length;
  const dispatched = reports.filter((r) => r.status === "en_route" || r.status === "assigned").length;

  async function confirm(reportId: string, resourceId: string, name: string) {
    await db.dispatchResource(reportId, resourceId);
    toast.success("Dispatch confirmed", { description: `${name} is en route.` });
  }

  async function reassign(reportId: string, exclude: string) {
    const report = reports.find((r) => r.id === reportId);
    if (!report) return;
    const alt = resources
      .filter((r) => r.id !== exclude && r.availableCount > 0 && r.status !== "depleted")
      .sort(
        (a, b) => haversineKm(report.location, a.location) - haversineKm(report.location, b.location),
      )[0];
    if (!alt) {
      toast.error("No alternative resource is available right now");
      return;
    }
    await db.dispatchResource(reportId, alt.id);
    toast.success("Reassigned", { description: `${alt.name} is en route instead.` });
  }

  return (
    <AppShell fullBleed>
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold md:text-3xl">Operations console</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Live incidents, resource readiness and allocation suggestions.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await db.resetDemoData();
              toast.success("Demo data reset");
            }}
          >
            <RotateCcw className="size-4" /> Reset demo data
          </Button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Open incidents" value={openReports.length} />
          <Stat label="Critical" value={critical} tone="critical" />
          <Stat label="Units dispatched" value={dispatched} />
          <Stat label="Resources available" value={resources.filter((r) => r.availableCount > 0).length} />
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <div className="h-[420px] overflow-hidden rounded-2xl border border-border shadow-card xl:h-[720px]">
            <IncidentMap reports={openReports} resources={resources} focus={focus} />
          </div>

          <Tabs defaultValue="allocation" className="flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="allocation">Allocation</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>

            <TabsContent value="allocation" className="space-y-3 xl:max-h-[660px] xl:overflow-y-auto xl:pr-1">
              {suggestions.length === 0 ? (
                <Empty text="No pending incidents need allocation." />
              ) : (
                suggestions.map(({ report, resource, distanceKm, score }) => (
                  <Card key={report.id} className="shadow-card">
                    <CardContent className="space-y-3 pt-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-sm font-semibold capitalize">{report.type}</span>
                        <SeverityBadge severity={report.severity} score={report.severityScore} />
                        <span className="ml-auto text-xs text-muted-foreground">
                          match {score.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                      <div className="rounded-xl border border-primary/25 bg-primary/5 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                          Suggested resource
                        </p>
                        <p className="mt-1 text-sm font-medium">{resource.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {distanceKm.toFixed(1)} km away · {resource.availableCount} of{" "}
                          {resource.capacity} available
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => void confirm(report.id, resource.id, resource.name)}
                        >
                          <CheckCircle2 className="size-4" /> Confirm dispatch
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void reassign(report.id, resource.id)}
                        >
                          Reassign
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setFocus(report.location)}>
                          View on map
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="reports" className="space-y-3 xl:max-h-[660px] xl:overflow-y-auto xl:pr-1">
              {reports
                .slice()
                .sort((a, b) => b.severityScore - a.severityScore)
                .map((r) => (
                  <Card key={r.id} className="shadow-card">
                    <CardContent className="space-y-2 pt-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-sm font-semibold capitalize">{r.type}</span>
                        <SeverityBadge severity={r.severity} score={r.severityScore} />
                        <StatusBadge status={r.status} className="ml-auto" />
                      </div>
                      <p className="text-sm text-muted-foreground">{r.description}</p>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>
                          {r.address} · via {r.source.toUpperCase()} · {r.peopleAffected}
                        </span>
                        {r.status !== "resolved" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              await db.updateReport(r.id, { status: "resolved" });
                              toast.success("Marked resolved");
                            }}
                          >
                            Mark resolved
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>

            <TabsContent value="resources" className="space-y-3 xl:max-h-[660px] xl:overflow-y-auto xl:pr-1">
              {resources.map((r) => (
                <ResourceCard key={r.id} resource={r} onFocus={() => setFocus(r.location)} />
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "critical" }) {
  return (
    <Card className="shadow-card">
      <CardContent className="py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p
          className={`mt-1 font-display text-2xl font-bold ${
            tone === "critical" ? "text-sev-critical" : "text-foreground"
          }`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function ResourceCard({ resource, onFocus }: { resource: Resource; onFocus: () => void }) {
  const pct = Math.round((resource.availableCount / Math.max(resource.capacity, 1)) * 100);
  return (
    <Card className="shadow-card">
      <CardContent className="space-y-2 pt-5">
        <div className="flex items-center gap-2">
          <Truck className="size-4 text-primary" />
          <span className="text-sm font-semibold">{resource.name}</span>
          <span className="ml-auto text-xs capitalize text-muted-foreground">{resource.status}</span>
        </div>
        <p className="text-xs text-muted-foreground">{resource.address}</p>
        <Progress value={pct} />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {resource.availableCount} of {resource.capacity} available
          </span>
          <Button size="sm" variant="ghost" onClick={onFocus}>
            View on map
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <Card className="shadow-card">
      <CardContent className="py-12 text-center text-sm text-muted-foreground">{text}</CardContent>
    </Card>
  );
}
