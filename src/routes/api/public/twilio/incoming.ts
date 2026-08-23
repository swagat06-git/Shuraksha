import { createFileRoute } from "@tanstack/react-router";

import { scoreSeverity } from "@/lib/severity";
import type { ReportType } from "@/lib/types";

/**
 * Twilio SMS / IVR intake webhook.
 * Point your Twilio number's messaging webhook at:
 *   https://<your-domain>/api/public/twilio/incoming
 *
 * Twilio posts application/x-www-form-urlencoded (Body, From, SpeechResult...).
 * The parsed report is scored and returned as TwiML; wire the persistence call
 * to Firestore where indicated once the backend is connected.
 */

const TYPE_KEYWORDS: Array<[ReportType, string[]]> = [
  ["flood", ["flood", "water", "inundat", "baadh"]],
  ["cyclone", ["cyclone", "storm", "wind", "typhoon"]],
  ["landslide", ["landslide", "slide", "mudslide", "rockfall"]],
];

function detectType(text: string): ReportType {
  const lower = text.toLowerCase();
  for (const [type, keys] of TYPE_KEYWORDS) {
    if (keys.some((k) => lower.includes(k))) return type;
  }
  return "other";
}

function twiml(message: string): Response {
  const body = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`;
  return new Response(body, { headers: { "content-type": "application/xml" } });
}

export const Route = createFileRoute("/api/public/twilio/incoming")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const form = new URLSearchParams(await request.text());
        const from = form.get("From") ?? "";
        const text = (form.get("Body") ?? form.get("SpeechResult") ?? "").trim();
        const source = form.get("Body") ? "sms" : "ivr";

        if (!text) {
          return twiml("Shuraksha: we could not read your message. Please resend with details.");
        }

        const type = detectType(text);
        const scored = scoreSeverity(text, type);

        const report = {
          userId: null,
          source,
          from,
          type,
          description: text,
          status: "pending" as const,
          ...scored,
          createdAt: Date.now(),
        };

        // TODO(backend): persist `report` to the reports collection, which
        // triggers the same severity-scoring and allocation flow as the app.
        console.info("[twilio] incoming report", report);

        return twiml(
          `Shuraksha: report received (${type}, severity ${scored.severity}). A response team has been notified.`,
        );
      },
    },
  },
});
