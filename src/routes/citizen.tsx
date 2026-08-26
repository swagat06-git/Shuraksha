import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Siren } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { IncidentMap } from "@/components/IncidentMap";
import { SeverityBadge, StatusBadge } from "@/components/SeverityBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { haversineKm } from "@/lib/geo";
import { CENTER } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import type { GeoPoint } from "@/lib/types";

export const Route = createFileRoute("/citizen")({
  head: () => ({
    meta: [
      { title: "Live incidents near you — Shuraksha" },
      {
        name: "description",
        content: "See severity-scored flood, cyclone and landslide incidents reported around you in real time.",
      },
      { property: "og:title", content: "Live incidents near you — Shuraksha" },
      { property: "og:description", content: "A live map of hazards reported in your area." },
    ],
  }),
  component: CitizenDashboard,
});

function CitizenDashboard() {
  const { reports, resources } = useStore();
  const [focus, setFocus] = useState<GeoPoint | null>(null);

  const EMERGENCY_SMS_NUMBER = "+916299816901";

  function sendEmergencySms() {
    if (!navigator.geolocation) {
      alert("GPS/location is not available on this device.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude.toFixed(6);
        const longitude = position.coords.longitude.toFixed(6);

        const message =
          `SHURAKSHA EMERGENCY\n` +
          `I need assistance.\n` +
          `Location: ${latitude}, ${longitude}`;

        const smsUrl =
          `sms:${EMERGENCY_SMS_NUMBER}?body=${encodeURIComponent(message)}`;

        window.location.href = smsUrl;
      },
      (error) => {
        console.error("Could not get GPS location:", error);

        alert(
          "We could not get your location. Please allow location access and try again.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  }

  const active = useMemo(
    () =>
      reports
        .filter((r) => r.status !== "resolved")
        .sort((a, b) => b.severityScore - a.severityScore),
    [reports],
  );

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Incidents near you</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {active.length} active incident{active.length === 1 ? "" : "s"} in your area.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <Button
          variant="destructive"
          onClick={() => void sendEmergencySms()}
          className="font-semibold"
        >
          <Siren className="size-4" />
          Send SOS Alert
        </Button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="h-[380px] overflow-hidden rounded-2xl border border-border shadow-card md:h-[560px]">
          <IncidentMap reports={active} focus={focus} onSelectReport={() => undefined} />
        </div>

        <ul className="space-y-3 lg:max-h-[560px] lg:overflow-y-auto lg:pr-1">
          {active.map((r) => (
            <li key={r.id}>
              <Card className="shadow-card transition-shadow hover:shadow-lift">
                <CardContent className="space-y-2 pt-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm font-semibold capitalize">{r.type}</span>
                    <SeverityBadge severity={r.severity} score={r.severityScore} />
                  </div>
                  <p className="text-sm text-muted-foreground">{r.description}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>
                      {r.address} · {haversineKm(CENTER, r.location).toFixed(1)} km away
                    </span>
                    <StatusBadge status={r.status} />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-0 text-primary hover:bg-transparent hover:underline"
                    onClick={() => setFocus(r.location)}
                  >
                    View on map
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </div>
      <section className="mt-8">
        <div>
          <h2 className="font-display text-xl font-bold md:text-2xl">
            Emergency resources near you
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            View available rescue teams, shelters, supplies and equipment in the Rourkela region.
          </p>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <Card key={resource.id} className="shadow-card">
              <CardContent className="space-y-3 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{resource.name}</h3>
                    <p className="mt-1 text-xs capitalize text-muted-foreground">
                      {resource.type}
                    </p>
                  </div>

                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium capitalize text-primary">
                    {resource.status}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground">
                  {resource.address}
                </p>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Available
                  </span>
                  <span className="font-semibold">
                    {resource.availableCount} / {resource.capacity}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
