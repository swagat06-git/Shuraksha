import { scoreSeverityWithAI } from "./ai-severity";
import type { ReportType, Severity } from "./types";
import {
  scoreSeverity,
  type SeverityResult,
} from "./severity-heuristic";

export type { SeverityResult };

export { scoreSeverity };

export async function scoreSeverityWithFallback(
  description: string,
  type: ReportType,
): Promise<SeverityResult> {
  try {
    return await scoreSeverityWithAI({
      data: {
        description,
        type,
      },
    });
  } catch (error) {
    console.warn(
      "AI severity scoring unavailable; using heuristic fallback.",
      error,
    );

    return scoreSeverity(description, type);
  }
}