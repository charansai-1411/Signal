import type { Decision, Signal } from "@/lib/schema";
import { StatusChip } from "./StatusChip";
import { ContradictionPanel } from "./ContradictionPanel";
import { SourceTrail } from "./SourceTrail";

export function DecisionCard({
  decision,
  signalsById,
  index,
}: {
  decision: Decision;
  signalsById: Record<string, Signal>;
  index: number;
}) {
  const sourceSignals = decision.source_signal_ids
    .map((id) => signalsById[id])
    .filter(Boolean) as Signal[];

  const contradiction =
    decision.contradiction?.detected === true ? decision.contradiction : null;

  const contraSignals = (contradiction?.signal_ids ?? [])
    .map((id) => signalsById[id])
    .filter(Boolean) as Signal[];

  return (
    <article
      className="animate-rise-in rounded-card border border-border bg-surface p-6 shadow-card"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-sans text-card-title font-semibold text-ink">
          {decision.title}
        </h2>
        <StatusChip status={decision.status} />
      </div>

      <p className="mt-2 text-[1rem] leading-[1.6] text-ink">
        {decision.state_summary}
      </p>

      <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {decision.blocker && (
          <div>
            <dt className="font-sans text-label font-medium uppercase tracking-[0.04em] text-ink-muted">
              Blocker
            </dt>
            <dd className="mt-0.5 text-[0.9375rem] leading-relaxed text-ink">
              {decision.blocker}
            </dd>
          </div>
        )}
        {decision.owner_role && (
          <div>
            <dt className="font-sans text-label font-medium uppercase tracking-[0.04em] text-ink-muted">
              Owner
            </dt>
            <dd className="mt-0.5 text-[0.9375rem] leading-relaxed text-ink">
              {decision.owner_role}
            </dd>
          </div>
        )}
      </dl>

      {contradiction && contraSignals.length >= 2 && (
        <ContradictionPanel
          explanation={contradiction.explanation}
          signals={contraSignals}
        />
      )}

      <div className="mt-4 border-t border-border pt-1" />
      <SourceTrail signals={sourceSignals} />
    </article>
  );
}
