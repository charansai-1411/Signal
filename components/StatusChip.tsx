import type { Status } from "@/lib/schema";

const LABELS: Record<Status, string> = {
  CONTRADICTION: "Contradiction",
  BLOCKED: "Blocked",
  OPEN: "Open",
  RESOLVED: "Resolved",
};

// Solid-tint pills (PRD §9.3). Text label always present — never colour-alone (§9.4).
const STYLES: Record<Status, string> = {
  CONTRADICTION: "bg-[var(--status-contra)] text-white",
  BLOCKED: "bg-[var(--status-blocked)] text-white",
  OPEN: "bg-[color-mix(in_srgb,var(--status-open)_16%,transparent)] text-[var(--status-open)]",
  RESOLVED: "bg-[color-mix(in_srgb,var(--status-resolved)_16%,transparent)] text-[var(--status-resolved)]",
};

export function StatusChip({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 font-sans text-label font-medium uppercase tracking-[0.04em] ${STYLES[status]}`}
    >
      {status === "CONTRADICTION" ? "⚠ " : ""}
      {LABELS[status]}
    </span>
  );
}
