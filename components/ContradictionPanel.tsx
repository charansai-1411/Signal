import type { Signal } from "@/lib/schema";

/**
 * The ⚠ panel (PRD §4.3). The two conflicting messages are the REAL extracted
 * signals (rehydrated from contradiction.signal_ids), shown side by side with
 * their channels, plus one line explaining why they can't both be true.
 */
export function ContradictionPanel({
  explanation,
  signals,
}: {
  explanation: string;
  signals: Signal[];
}) {
  if (signals.length < 2) return null;

  return (
    <div className="mt-4 rounded-lg border border-[color-mix(in_srgb,var(--status-contra)_28%,var(--border))] bg-contra-tint p-4">
      <div className="flex items-center gap-2 font-sans text-label font-semibold uppercase tracking-[0.04em] text-[var(--status-contra)]">
        <span aria-hidden>⚠</span>
        Contradiction detected
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {signals.slice(0, 2).map((s) => (
          <div
            key={s.id}
            className="rounded-md border border-[color-mix(in_srgb,var(--status-contra)_18%,var(--border))] bg-surface p-3"
          >
            <div className="mb-1.5 font-sans text-[0.75rem] font-semibold uppercase tracking-[0.04em] text-[var(--status-contra)]">
              {s.channel}
            </div>
            <p className="font-mono text-source leading-relaxed text-ink">
              {s.raw_text}
            </p>
          </div>
        ))}
      </div>

      {explanation && (
        <p className="mt-3 font-sans text-[0.9375rem] leading-relaxed text-ink">
          {explanation}
        </p>
      )}
    </div>
  );
}
