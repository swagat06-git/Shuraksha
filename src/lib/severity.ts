import type { ReportType, Severity } from "./types";

const CRITICAL = ["trapped", "drowning", "swept", "collapsed", "buried", "dead", "missing"];
const HIGH = ["rescue", "stranded", "roof", "chest", "elderly", "children", "hospital", "urgent"];
const MEDIUM = ["rising", "blocked", "power", "waist", "evacuat", "damage"];

const PEOPLE_RE = /(\d{1,4})\s*(?:\+)?\s*(?:people|persons|families|villagers|residents|households)/i;

export interface SeverityResult {
  severity: Severity;
  severityScore: number;
  hazardType: string;
  peopleAffected: string;
}

/**
 * Heuristic stand-in for the LLM severity scoring step.
 * Swap the body for a call to the scoring endpoint when the backend is wired.
 */
export function scoreSeverity(description: string, type: ReportType): SeverityResult {
  const text = description.toLowerCase();
  let score = type === "landslide" ? 5 : type === "cyclone" ? 4.5 : 4;

  if (CRITICAL.some((k) => text.includes(k))) score += 4.5;
  else if (HIGH.some((k) => text.includes(k))) score += 2.5;
  else if (MEDIUM.some((k) => text.includes(k))) score += 1;

  const match = text.match(PEOPLE_RE);
  const count = match ? Number(match[1]) : 0;
  if (count >= 100) score += 2;
  else if (count >= 20) score += 1;

  score = Math.min(10, Math.max(1, Math.round(score * 10) / 10));

  const severity: Severity =
    score >= 8.5 ? "critical" : score >= 6.5 ? "high" : score >= 4.5 ? "medium" : "low";

  return {
    severity,
    severityScore: score,
    hazardType: type === "other" ? "unclassified hazard" : type,
    peopleAffected: count ? `~${count} people` : "unknown",
  };
}
