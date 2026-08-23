import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BrainCircuit,
  MapPin,
  Radio,
  ShieldCheck,
  Siren,
  Truck,
  Waves,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shuraksha — Disaster Reporting & Response Coordination" },
      {
        name: "description",
        content:
          "Shuraksha connects citizen incident reports with authority resource dispatch in real time for floods, cyclones and landslides.",
      },
      { property: "og:title", content: "Shuraksha — Prepare · Act · Recover" },
      {
        property: "og:description",
        content:
          "Report floods, cyclones and landslides in seconds. Authorities see severity-scored incidents live and dispatch the nearest team.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: MapPin,
    title: "Pin-point reporting",
    body: "Citizens drop a pin or use GPS, pick the hazard, add a photo and submit in under 30 seconds.",
  },
  {
    icon: BrainCircuit,
    title: "AI severity scoring",
    body: "Every report is classified Low to Critical with hazard type and people affected extracted automatically.",
  },
  {
    icon: Truck,
    title: "Allocation engine",
    body: "The nearest available NDRF team, shelter or supply point is ranked by distance and severity.",
  },
  {
    icon: Radio,
    title: "SMS & IVR intake",
    body: "No smartphone, no problem. Reports arriving by text or voice call enter the same response queue.",
  },
];

const STEPS = [
  { icon: Siren, title: "Report", body: "A citizen reports flooding on their street with a photo." },
  { icon: BrainCircuit, title: "Score", body: "Severity is scored 1–10 and the incident is triaged." },
  { icon: Truck, title: "Allocate", body: "The engine suggests the closest capable resource." },
  { icon: ShieldCheck, title: "Dispatch", body: "The control room confirms and status goes live." },
];

function Landing() {
  return (
    <AppShell>
      <section className="relative overflow-hidden rounded-3xl border border-border bg-navy px-6 py-14 shadow-card md:px-12 md:py-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(1000px 380px at 15% 0%, var(--color-primary), transparent 65%), radial-gradient(700px 320px at 95% 100%, var(--color-rescue), transparent 60%)",
          }}
          aria-hidden
        />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-navy-foreground/20 bg-navy-foreground/10 px-3 py-1 text-xs font-semibold tracking-wide text-navy-foreground">
            <Waves className="size-3.5" /> Flood · Cyclone · Landslide
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold leading-tight text-navy-foreground md:text-5xl">
            One line of sight from a citizen's cry for help to the team that answers it.
          </h1>
          <p className="mt-4 text-base text-navy-foreground/80 md:text-lg">
            Shuraksha turns scattered distress reports into a severity-ranked operating picture, and
            puts the nearest rescue resource one click away.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="destructive" className="font-semibold">
              <Link to="/report">
                Report an incident <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-navy-foreground/30 bg-navy-foreground/10 text-navy-foreground hover:bg-navy-foreground/20 hover:text-navy-foreground"
            >
              <Link to="/authority">Open authority console</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-bold md:text-3xl">Built for the first hour</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          The hour after a hazard strikes decides the outcome. Every feature exists to shorten it.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Card key={f.title} className="border-border shadow-card">
              <CardContent className="pt-6">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-14 rounded-3xl border border-border bg-card p-6 shadow-card md:p-10">
        <h2 className="font-display text-2xl font-bold md:text-3xl">How the loop closes</h2>
        <ol className="mt-6 grid gap-6 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative">
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-navy text-navy-foreground">
                <s.icon className="size-5" />
              </span>
              <p className="mt-3 text-xs font-bold uppercase tracking-widest text-primary">
                Step {i + 1}
              </p>
              <h3 className="mt-1 text-base font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className="mt-14 flex flex-col items-center gap-3 border-t border-border py-8 text-center">
        <Logo showTagline />
        <p className="text-xs text-muted-foreground">
          Demonstration build with seeded incident and resource data.
        </p>
      </footer>
    </AppShell>
  );
}
