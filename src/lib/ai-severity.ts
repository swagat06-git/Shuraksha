import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { scoreSeverity } from "./severity";
import type { ReportType, Severity } from "./types";

const InputSchema = z.object({
  description: z.string().min(1).max(5000),
  type: z.enum(["flood", "cyclone", "landslide", "other"]),
});

const AiSeveritySchema = z.object({
  severity: z.enum(["low", "medium", "high", "critical"]),
  severityScore: z.number().min(1).max(10),
  hazardType: z.string().min(1),
  peopleAffected: z.string().min(1),
});

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    severity: {
      type: "string",
      enum: ["low", "medium", "high", "critical"],
    },
    severityScore: {
      type: "number",
      minimum: 1,
      maximum: 10,
    },
    hazardType: {
      type: "string",
    },
    peopleAffected: {
      type: "string",
    },
  },
  required: ["severity", "severityScore", "hazardType", "peopleAffected"],
};

export const scoreSeverityWithAI = createServerFn({ method: "POST" })
  .validator(InputSchema)
  .handler(async ({ data }) => {
    const fallback = () => scoreSeverity(data.description, data.type);

    const apiKey = process.env["GEMINI_API_KEY"];

    if (!apiKey) {
      return fallback();
    }

    try {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `
You are Shuraksha's emergency severity assessment engine.

Analyze this disaster report and return a severity assessment.

Severity rules:
- critical: immediate threat to life, trapped people, drowning, collapse, severe injury, or inability to evacuate.
- high: serious danger requiring urgent intervention.
- medium: meaningful hazard requiring assistance but without clear immediate life danger.
- low: limited hazard or minor damage.

Consider the whole report, including vulnerable people, injuries, evacuation difficulty, water conditions, and number of people affected.

Do not exaggerate the severity.
Return a score from 1 to 10.
If the number of affected people is not stated, use "unknown".

Hazard type: ${data.type}

Citizen report:
${data.description}
`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
              responseSchema: RESPONSE_SCHEMA,
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Gemini API request failed: ${response.status}`);
      }

      const payload = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
      };

      const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error("Gemini returned no result");
      }

      const parsed = AiSeveritySchema.parse(JSON.parse(text));

      return {
        ...parsed,
        severityScore: Math.round(parsed.severityScore * 10) / 10,
      } satisfies {
        severity: Severity;
        severityScore: number;
        hazardType: string;
        peopleAffected: string;
      };
    } catch (error) {
      console.warn("Gemini severity scoring failed; using heuristic fallback.", error);
      return fallback();
    }
  });