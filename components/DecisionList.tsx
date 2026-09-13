import type { AnalyzeResponse, Signal } from "@/lib/schema";
import { DecisionCard } from "./DecisionCard";

export function DecisionList({ data }: { data: AnalyzeResponse }) {
  const signalsById: Record<string, Signal> = Object.fromEntries(
    data.signals.map((s) => [s.id, s]),
  );

  if (data.decisions.length === 0) {
    return (
      <div className="rounded-card border border-border bg-surface p-6 shadow-card">
        <p className="text-ink">No distinct decisions found in these messages.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="font-sans text-label font-medium uppercase tracking-[0.04em] text-ink-muted">
        {data.decisions.length} decision
        {data.decisions.length === 1 ? "" : "s"} · sorted by urgency
      </div>
      {data.decisions.map((d, i) => (
        <DecisionCard
          key={d.id}
          decision={d}
          signalsById={signalsById}
          index={i}
        />
      ))}
    </div>
  );
}
