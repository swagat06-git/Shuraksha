import { createFileRoute } from "@tanstack/react-router";

import { createReport } from "@/services/firebase";
import type { ReportType } from "@/lib/types";

const TYPE_KEYWORDS: Array<[ReportType, string[]]> = [
  ["flood", ["flood", "water", "inundat", "baadh"]],
  ["cyclone", ["cyclone", "storm", "wind", "typhoon"]],
  ["landslide", ["landslide", "slide", "mudslide", "rockfall"]],
];

function detectType(text: string): ReportType {
  const lower = text.toLowerCase();

  for (const [type, keys] of TYPE_KEYWORDS) {
    if (keys.some((key) => lower.includes(key))) {
      return type;
    }
  }

  return "other";
}

function extractCoordinates(text: string): { lat: number; lng: number } | null {
  const match = text.match(
    /(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/,
  );

  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  return { lat, lng };
}

function twiml(message: string): Response {
  const escaped = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

  const body = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`;

  return new Response(body, {
    headers: { "content-type": "application/xml" },
  });
}

export const Route = createFileRoute("/api/public/twilio/incoming")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const form = new URLSearchParams(await request.text());

        const from = form.get("From") ?? "";
        const text = (
          form.get("Body") ??
          form.get("SpeechResult") ??
          ""
        ).trim();

        if (!text) {
          return twiml(
            "Shuraksha: we could not read your message. Please resend with details.",
          );
        }

        const location = extractCoordinates(text);

        if (!location) {
          return twiml(
            "Shuraksha: please include your location as latitude,longitude. Example: FLOOD 12.9716,77.5946 Water rising inside house.",
          );
        }

        const type = detectType(text);
        const source = form.get("Body") ? "sms" : "ivr";

        const description = text
          .replace(/-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?/, "")
          .replace(/^\s*(flood|cyclone|landslide|other)\b\s*/i, "")
          .trim();


        const report = await createReport({
          userId: null,
          source,
          location,
          address: "Location provided via SMS",
          type,
          description,
          phone: from,
        });

        console.info("[twilio] incoming report created", {
          id: report.id,
          from,
          type: report.type,
          severity: report.severity,
        });

        return twiml(
          `Shuraksha: report received. Severity ${report.severity}. Your incident has been forwarded to the response team.`,
        );
      },
    },
  },
});