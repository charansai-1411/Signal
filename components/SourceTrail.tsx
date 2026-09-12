"use client";

import { useState, useId } from "react";
import type { Signal } from "@/lib/schema";

export function SourceTrail({ signals }: { signals: Signal[] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  if (signals.length === 0) return null;

  return (
    <div className="mt-4">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 font-sans text-label font-medium uppercase tracking-[0.04em] text-ink-muted transition-colors hover:text-ink"
      >
        <span
          className="inline-block transition-transform duration-200"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
          aria-hidden
        >
          ▸
        </span>
        Source trail ({signals.length})
      </button>

      {open && (
        <div
          id={panelId}
          className="mt-3 space-y-2 rounded-lg border border-border bg-paper p-3"
        >
          {signals.map((s) => (
            <div key={s.id} className="font-mono text-source leading-relaxed">
              <span className="mr-2 rounded bg-[color-mix(in_srgb,var(--ink)_7%,transparent)] px-1.5 py-0.5 text-[0.75rem] font-medium text-ink-muted">
                {s.channel}
              </span>
              <span className="text-ink">{s.raw_text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
