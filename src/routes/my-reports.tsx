import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

import { AppShell } from "@/components/AppShell";
import { SeverityBadge, StatusBadge } from "@/components/SeverityBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import * as db from "@/services/firebase";

export const Route = createFileRoute("/my-reports")({
  head: () => ({
    meta: [
      { title: "My reports — Shuraksha" },
      { name: "description", content: "Track the status of every incident you have reported to Shuraksha." },
      { property: "og:title", content: "My reports — Shuraksha" },
      { property: "og:description", content: "Severity, assigned resource and live status for your reports." },
    ],
  }),
  component: MyReports,
});

function timeAgo(ts: number) {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return hrs < 24 ? `${hrs} h ago` : `${Math.round(hrs / 24)} d ago`;
}

function MyReports() {
  const { reports, resources, user } = useStore();

  const mine = useMemo(
    () =>
      reports
        .filter((r) => (user ? r.userId === user.uid || r.userId === null : true))
        .sort((a, b) => b.createdAt - a.createdAt),
    [reports, user],
  );

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">My reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every report you filed and where it stands.</p>
        </div>
        <Button asChild variant="destructive">
          <Link to="/report">New report</Link>
        </Button>
      </div>

      {mine.length === 0 ? (
        <Card className="mt-6 shadow-card">
          <CardContent className="py-14 text-center text-sm text-muted-foreground">
            You haven't filed any reports yet.
          </CardContent>
        </Card>
      ) : (
        <ul className="mt-6 space-y-3">
          {mine.map((r) => {
            const resource = resources.find((res) => res.id === r.assignedResourceId);
            return (
              <li key={r.id}>
                <Card className="shadow-card">
                  <CardContent className="pt-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-sm font-semibold capitalize">{r.type}</span>
                      <SeverityBadge severity={r.severity} score={r.severityScore} />
                      <StatusBadge status={r.status} className="ml-auto" />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>

                    <div className="rounded-lg border bg-muted/30 px-3 py-3 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-foreground">Citizen status:</span>

                        {r.citizenStatus === "safe" ? (
                          <span className="font-semibold text-green-600">I'm Safe</span>
                        ) : r.citizenStatus === "needs_help" ? (
                          <span className="font-semibold text-orange-600">Still Needs Help</span>
                        ) : (
                          <span className="text-muted-foreground">No response yet</span>
                        )}
                      </div>

                      {r.status !== "resolved" ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              await db.updateReport(r.id, { citizenStatus: "safe" });
                            }}
                          >
                            I'm Safe
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={async () => {
                              await db.updateReport(r.id, { citizenStatus: "needs_help" });
                            }}
                          >
                            Still Need Help
                          </Button>
                        </div>
                      ) : null}
                    </div>
                    {r.photoUrl ? (
                      <img
                        src={r.photoUrl}
                        alt="Reported scene"
                        className="mt-3 h-32 w-full rounded-xl object-cover"
                      />
                    ) : null}
                    <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
                      <div className="flex gap-1.5">
                        <dt className="font-medium text-foreground">Location:</dt>
                        <dd>{r.address}</dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt className="font-medium text-foreground">Filed:</dt>
                        <dd>
                          {timeAgo(r.createdAt)} via {r.source.toUpperCase()}
                        </dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt className="font-medium text-foreground">People affected:</dt>
                        <dd>{r.peopleAffected}</dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt className="font-medium text-foreground">Assigned:</dt>
                        <dd>{resource ? resource.name : "Awaiting dispatch"}</dd>
                      </div>
                    </dl>
                    {r.status !== "resolved" ? (
                      <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
                        <span className="text-xs font-medium text-muted-foreground">
                          Your status:
                        </span>

                        <Button
                          size="sm"
                          variant={r.citizenStatus === "safe" ? "default" : "outline"}
                          onClick={async () => {
                            await db.updateReport(r.id, { citizenStatus: "safe" });
                          }}
                        >
                          I'm Safe
                        </Button>

                        <Button
                          size="sm"
                          variant={r.citizenStatus === "needs_help" ? "destructive" : "outline"}
                          onClick={async () => {
                            await db.updateReport(r.id, { citizenStatus: "needs_help" });
                          }}
                        >
                          I Still Need Help
                        </Button>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
