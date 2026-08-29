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
import { sendSms } from "@/services/sms";

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

  function findEvacuationTeam(reportLocation: GeoPoint): Resource | undefined {
    return resources
      .filter(
        (r) =>
          r.type === "evacuation" &&
          r.availableCount > 0 &&
          r.status !== "depleted",
      )
      .sort(
        (a, b) =>
          haversineKm(reportLocation, a.location) -
          haversineKm(reportLocation, b.location),
      )[0];
  }

  async function notifyCitizen(reportId: string) {
    const report = reports.find((r) => r.id === reportId);

    if (!report) {
      toast.error("Incident not found");
      return;
    }

    if (!report.userId) {
      toast.error("No citizen is linked to this incident");
      return;
    }

    try {
      const phone = await db.getUserPhone(report.userId);

      if (!phone) {
        toast.error("No phone number is saved for this citizen");
        return;
      }

      await sendSms({
        to: phone,
        message:
          "Shuraksha: emergency assistance has been assigned to your incident. Please stay in a safe location and keep your phone available.",
      });

      toast.success("Citizen notification sent");
    } catch (error) {
      console.error("[authority] SMS notification error", error);
      toast.error("Unable to send citizen notification");
    }
  }

  async function confirm(
    reportId: string,
    resourceId: string,
    name: string,
    resourceType: Resource["type"],
  ) {
    const report = reports.find((r) => r.id === reportId);

    console.info("[authority] dispatch report", report);

    await db.dispatchResource(reportId, resourceId);

    if (report?.phone) {
      await sendSms({
        to: report.phone,
        message:
          "Shuraksha: your emergency report has been received and help is on the way. Please stay in a safe location and keep your phone available.",
      });
    }

    if (resourceType === "shelter") {

      if (report) {
        const evacuationTeam = findEvacuationTeam(report.location);

        if (evacuationTeam) {
          await db.dispatchResource(reportId, evacuationTeam.id);

          toast.success("Camp activated + evacuation team dispatched", {
            description: `${name} is active. ${evacuationTeam.name} is heading to the affected area.`,
          });
          return;
        }
      }

      toast.success("Camp activated", {
        description: `${name} is now active. No evacuation team is currently available.`,
      });
    } else {
      toast.success("Dispatch confirmed", {
        description: `${name} is en route.`,
      });
    }
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
          {/* <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await db.resetDemoData();
              toast.success("Demo data reset");
            }}
          >
            <RotateCcw className="size-4" /> Reset demo data
          </Button> */}
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
                      {resource.type === "shelter" ? (
                        (() => {
                          const evacuationTeam = findEvacuationTeam(report.location);

                          return evacuationTeam ? (
                            <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                                Evacuation support
                              </p>
                              <p className="mt-1 text-sm font-medium">
                                {evacuationTeam.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {haversineKm(report.location, evacuationTeam.location).toFixed(1)} km
                                away · {evacuationTeam.availableCount} of{" "}
                                {evacuationTeam.capacity} available
                              </p>
                            </div>
                          ) : null;
                        })()
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            void confirm(
                              report.id,
                              resource.id,
                              resource.name,
                              resource.type,
                            )
                          }
                        >
                          <CheckCircle2 className="size-4" />
                          {resource.type === "shelter" ? "Activate camp" : "Confirm dispatch"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!report.userId}
                          onClick={() => void notifyCitizen(report.id)}
                        >
                          Notify Citizen
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
                .sort((a, b) => {
                  const aNeedsHelp = a.citizenStatus === "needs_help" ? 1 : 0;
                  const bNeedsHelp = b.citizenStatus === "needs_help" ? 1 : 0;

                  if (aNeedsHelp !== bNeedsHelp) {
                    return bNeedsHelp - aNeedsHelp;
                  }

                  return b.severityScore - a.severityScore;
                })
                .map((r) => (
                  <Card
                    key={r.id}
                    className={`shadow-card ${r.citizenStatus === "needs_help"
                      ? "border-orange-400 bg-orange-50/50"
                      : ""
                      }`}
                  >
                    <CardContent className="space-y-2 pt-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-sm font-semibold capitalize">{r.type}</span>

                        {r.citizenStatus === "needs_help" ? (
                          <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-bold text-orange-700">
                            ⚠ ASSISTANCE REQUESTED
                          </span>
                        ) : null}

                        <SeverityBadge severity={r.severity} score={r.severityScore} />
                        <StatusBadge status={r.status} className="ml-auto" />
                      </div>
                      <p className="text-sm text-muted-foreground">{r.description}</p>

                      {r.photoUrl ? (
                        <div className="overflow-hidden rounded-xl border border-border">
                          <img
                            src={r.photoUrl}
                            alt="Incident scene"
                            className="max-h-80 w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ) : null}

                      <div className="mt-2 text-xs">
                        <span className="font-medium text-foreground">Citizen status: </span>
                        {r.citizenStatus === "safe" ? (
                          <span className="text-green-600">I'm Safe</span>
                        ) : r.citizenStatus === "needs_help" ? (
                          <span className="text-orange-600">Still Needs Help</span>
                        ) : (
                          <span className="text-muted-foreground">No response yet</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>
                          {r.address} · via {r.source.toUpperCase()} · {r.peopleAffected}
                        </span>
                        {r.status !== "resolved" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              await db.resolveReport(r.id);
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
          className={`mt-1 font-display text-2xl font-bold ${tone === "critical" ? "text-sev-critical" : "text-foreground"
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
