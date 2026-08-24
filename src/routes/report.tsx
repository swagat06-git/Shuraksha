import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Crosshair, Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { IncidentMap } from "@/components/IncidentMap";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CENTER } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import type { GeoPoint, ReportType } from "@/lib/types";
import * as db from "@/services/firebase";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Report an incident — Shuraksha" },
      {
        name: "description",
        content: "Pin the location, describe the hazard and attach a photo. Response teams see it instantly.",
      },
      { property: "og:title", content: "Report an incident — Shuraksha" },
      { property: "og:description", content: "Submit a flood, cyclone or landslide report in under a minute." },
    ],
  }),
  component: ReportPage,
});

const TYPES: Array<{ value: ReportType; label: string }> = [
  { value: "flood", label: "Flood" },
  { value: "cyclone", label: "Cyclone / storm" },
  { value: "landslide", label: "Landslide" },
  { value: "other", label: "Other hazard" },
];

function ReportPage() {
  const navigate = useNavigate();
  const { user } = useStore();
  const [pin, setPin] = useState<GeoPoint | null>(null);
  const [type, setType] = useState<ReportType>("flood");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [photoName, setPhotoName] = useState("");
  const [busy, setBusy] = useState(false);

  function useGps() {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    toast.error("Geolocation is not supported by this browser");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      console.log("GPS SUCCESS:", pos.coords);

      setPin({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });

      toast.success("Location captured");
    },
    (error) => {
      console.error("GPS ERROR:", error);

      toast.error(`GPS error ${error.code}: ${error.message}`);
    },
    {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 60000,
    },
  );
}

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pin) {
      toast.error("Pin the incident location on the map first");
      return;
    }
    if (description.trim().length < 10) {
      toast.error("Please describe what is happening (at least 10 characters)");
      return;
    }
    setBusy(true);
    try {
      const report = await db.createReport({
        userId: user?.uid ?? null,
        source: "app",
        location: pin,
        address: address.trim() || `${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}`,
        type,
        description: description.trim(),
        ...(photoUrl ? { photoUrl } : {}),
      });
      toast.success(`Report submitted — severity ${report.severity.toUpperCase()}`, {
        description: "Response teams have been notified.",
      });
      navigate({ to: "/my-reports" });
    } catch {
      toast.error("Could not submit your report. It will be retried when you're back online.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-bold md:text-3xl">Report an incident</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tap the map to drop a pin, or use your GPS location.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="h-[320px] overflow-hidden rounded-2xl border border-border shadow-card md:h-[520px]">
          <IncidentMap pin={pin} onPick={setPin} zoom={13} />
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-lg">Incident details</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submit}>
              <div className="space-y-2">
                <Label>Location</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={pin ? `${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}` : "No pin set"}
                    aria-label="Selected coordinates"
                  />
                  <Button type="button" variant="outline" onClick={useGps} aria-label="Use my location">
                    <Crosshair className="size-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Landmark or address (optional)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Hazard type</Label>
                <Select value={type} onValueChange={(v) => setType(v as ReportType)}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">What is happening?</Label>
                <Textarea
                  id="description"
                  rows={4}
                  placeholder="e.g. Water entered our lane, two elderly people are trapped on the first floor."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Mention people affected and whether anyone is trapped — it raises the severity score.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo">Photo (optional)</Label>
                <label
                  htmlFor="photo"
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-3 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary"
                >
                  <Upload className="size-4" />
                  {photoName || "Attach a photo of the scene"}
                </label>
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setPhotoName(file.name);
                    setPhotoUrl(URL.createObjectURL(file));
                  }}
                />
              </div>

              <Button type="submit" variant="destructive" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                Submit report
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
