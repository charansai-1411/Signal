"use client";

import { useState } from "react";
import type { AnalyzeResponse } from "@/lib/schema";
import { SAMPLE_PROJECT } from "@/lib/sample";
import { DecisionList } from "@/components/DecisionList";
import { LoadingCards } from "@/components/LoadingCards";
import { RoomsEntry } from "@/components/RoomsEntry";

type View =
  | { state: "empty" }
  | { state: "loading" }
  | { state: "result"; data: AnalyzeResponse }
  | { state: "error"; message: string };

export default function Page() {
  const [raw, setRaw] = useState("");
  const [view, setView] = useState<View>({ state: "empty" });

  async function analyze(text: string) {
    const input = text.trim();
    if (!input) return;
    setView({ state: "loading" });
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw: input }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setView({
          state: "error",
          message: body?.error ?? "Something broke on our side. Retry.",
        });
        return;
      }
      setView({ state: "result", data: body as AnalyzeResponse });
    } catch {
      setView({
        state: "error",
        message: "Couldn't reach the server. Check your connection and retry.",
      });
    }
  }

  function loadSample() {
    setRaw(SAMPLE_PROJECT);
    analyze(SAMPLE_PROJECT);
  }

  const isLoading = view.state === "loading";

  return (
    <main className="mx-auto max-w-content px-5 py-16 sm:py-24">
      {/* Masthead */}
      <header className="mb-10">
        <div className="mb-3 font-sans text-label font-semibold uppercase tracking-[0.14em] text-accent">
          Signal
        </div>
        <h1 className="font-display text-[2.75rem] font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-display">
          Find the decision in the noise.
        </h1>
        <p className="mt-4 max-w-[46ch] text-[1.0625rem] leading-relaxed text-ink-muted">
          Paste the mess from every channel. Signal surfaces what&apos;s
          actually stuck, who owns it, and where two people are contradicting
          each other without realising it.
        </p>
      </header>

      {/* Input */}
      <section className="mb-8">
        <label htmlFor="dump" className="sr-only">
          Paste project messages
        </label>
        <textarea
          id="dump"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          disabled={isLoading}
          rows={7}
          placeholder={
            "Paste messages across channels, one per line. Optionally prefix each with a channel/sender, e.g.\nWhatsApp — Rakesh: use the previous marble\nEmail — Priya: refer Rev 04"
          }
          className="w-full resize-y rounded-card border border-border bg-surface p-4 font-mono text-source leading-relaxed text-ink shadow-card outline-none transition-colors placeholder:text-[color-mix(in_srgb,var(--ink-muted)_70%,transparent)] focus:border-accent disabled:opacity-60"
        />

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => analyze(raw)}
            disabled={isLoading || !raw.trim()}
            className="accent-underline rounded-lg bg-accent px-5 py-2.5 font-sans text-[0.9375rem] font-semibold text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? "Analysing…" : "Analyse"}
          </button>
          <button
            type="button"
            onClick={loadSample}
            disabled={isLoading}
            className="font-sans text-[0.9375rem] font-medium text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline disabled:opacity-40"
          >
            Load sample project
          </button>
        </div>
      </section>

      {/* Output */}
      <section aria-live="polite">
        {view.state === "loading" && <LoadingCards />}

        {view.state === "error" && (
          <div className="rounded-card border border-border bg-surface p-6 shadow-card">
            <p className="text-[1rem] text-ink">{view.message}</p>
            <button
              type="button"
              onClick={() => analyze(raw)}
              className="mt-3 font-sans text-[0.9375rem] font-semibold text-accent underline-offset-4 hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {view.state === "result" && <DecisionList data={view.data} />}
      </section>

      {/* Collaborative rooms — secondary entry point (added feature) */}
      {view.state !== "result" && (
        <section className="mt-14 border-t border-border pt-10">
          <RoomsEntry />
        </section>
      )}
    </main>
  );
}
