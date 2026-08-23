import { cn } from "@/lib/utils";
import type { ReportStatus, Severity } from "@/lib/types";

const SEVERITY_CLASS: Record<Severity, string> = {
  low: "bg-sev-low/15 text-sev-low border-sev-low/30",
  medium: "bg-sev-medium/15 text-sev-medium border-sev-medium/30",
  high: "bg-sev-high/15 text-sev-high border-sev-high/30",
  critical: "bg-sev-critical/15 text-sev-critical border-sev-critical/35",
};

export function SeverityBadge({
  severity,
  score,
  className,
}: {
  severity: Severity;
  score?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
        SEVERITY_CLASS[severity],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {severity}
      {score !== undefined ? <span className="opacity-70">{score.toFixed(1)}</span> : null}
    </span>
  );
}

const STATUS_LABEL: Record<ReportStatus, string> = {
  pending: "Pending",
  assigned: "Assigned",
  en_route: "En route",
  resolved: "Resolved",
};

const STATUS_CLASS: Record<ReportStatus, string> = {
  pending: "bg-muted text-muted-foreground border-border",
  assigned: "bg-secondary/20 text-secondary-foreground border-secondary/40",
  en_route: "bg-primary/15 text-primary border-primary/30",
  resolved: "bg-sev-low/15 text-sev-low border-sev-low/30",
};

export function StatusBadge({ status, className }: { status: ReportStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STATUS_CLASS[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
