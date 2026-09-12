"use client";

import { useEffect, useState } from "react";

const STEPS = [
  "Reading channels…",
  "Extracting signals…",
  "Clustering decisions…",
  "Checking for contradictions…",
];

export function LoadingCards() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 1200);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <p
        aria-live="polite"
        className="mb-5 font-mono text-source text-ink-muted"
      >
        {STEPS[step]}
      </p>
      <div className="space-y-4">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="rounded-card border border-border bg-surface p-6 shadow-card"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="h-5 w-2/3 animate-pulse rounded bg-[color-mix(in_srgb,var(--ink)_8%,transparent)]" />
              <div className="h-6 w-20 animate-pulse rounded-full bg-[color-mix(in_srgb,var(--ink)_8%,transparent)]" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-3.5 w-full animate-pulse rounded bg-[color-mix(in_srgb,var(--ink)_6%,transparent)]" />
              <div className="h-3.5 w-5/6 animate-pulse rounded bg-[color-mix(in_srgb,var(--ink)_6%,transparent)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
