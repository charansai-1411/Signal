"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { AnalyzeResponse } from "@/lib/schema";
import type { Contribution, RoomMeta } from "@/lib/store";
import { DecisionList } from "@/components/DecisionList";
import { LoadingCards } from "@/components/LoadingCards";

const CHANNEL_OPTIONS = [
  "WhatsApp",
  "Email",
  "Site",
  "Client",
  "Supplier",
  "Drawings",
  "Unknown",
] as const;

const NAME_KEY = "signal:name";

type RoomState =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "ready"; meta: RoomMeta; contributions: Contribution[] };

type Analysis =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "result"; data: AnalyzeResponse }
  | { state: "error"; message: string };

export default function RoomPage({ params }: { params: { code: string } }) {
  const code = params.code.toUpperCase();

  const [room, setRoom] = useState<RoomState>({ status: "loading" });
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<(typeof CHANNEL_OPTIONS)[number]>("WhatsApp");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis>({ state: "idle" });
  const analyzingRef = useRef(false);

  // Load remembered display name.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(NAME_KEY);
      if (saved) setName(saved);
    } catch {}
  }, []);

  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${code}`, { cache: "no-store" });
      if (res.status === 404) {
        setRoom({ status: "missing" });
        return;
      }
      if (!res.ok) return; // transient; keep last good state
      const body = (await res.json()) as { meta: RoomMeta; contributions: Contribution[] };
      setRoom({ status: "ready", meta: body.meta, contributions: body.contributions });
    } catch {
      // network blip; leave state as-is
    }
  }, [code]);

  // Poll for live updates.
  useEffect(() => {
    fetchRoom();
    const id = setInterval(fetchRoom, 3000);
    return () => clearInterval(id);
  }, [fetchRoom]);

  function rememberName(v: string) {
    setName(v);
    try {
      localStorage.setItem(NAME_KEY, v.trim());
    } catch {}
  }

  async function addContribution() {
    const t = text.trim();
    if (!t || !name.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/rooms/${code}/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: name.trim(), channel, text: t }),
      });
      if (res.ok) {
        setText("");
        await fetchRoom(); // optimistic-ish refresh
      }
    } catch {
    } finally {
      setSending(false);
    }
  }

  async function analyseRoom() {
    if (analyzingRef.current) return;
    analyzingRef.current = true;
    setAnalysis({ state: "loading" });
    try {
      const res = await fetch(`/api/rooms/${code}/analyze`, { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setAnalysis({ state: "error", message: body?.error ?? "Something broke. Retry." });
        return;
      }
      setAnalysis({ state: "result", data: body as AnalyzeResponse });
    } catch {
      setAnalysis({ state: "error", message: "Couldn't reach the server. Retry." });
    } finally {
      analyzingRef.current = false;
    }
  }

  function copyCode() {
    try {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  if (room.status === "loading") {
    return (
      <main className="mx-auto max-w-content px-5 py-16">
        <p className="font-mono text-source text-ink-muted">Loading room {code}…</p>
      </main>
    );
  }

  if (room.status === "missing") {
    return (
      <main className="mx-auto max-w-content px-5 py-16">
        <h1 className="font-display text-h1 font-semibold text-ink">Room not found</h1>
        <p className="mt-3 text-ink-muted">
          No room with code <span className="font-mono">{code}</span>. It may have
          expired, or the code is off.
        </p>
        <Link href="/dashboard" className="mt-4 inline-block font-sans font-semibold text-accent hover:underline">
          ← Back to Signal
        </Link>
      </main>
    );
  }

  const { meta, contributions } = room;

  return (
    <main className="mx-auto max-w-content px-5 py-12 sm:py-16">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/dashboard" className="font-sans text-label font-semibold uppercase tracking-[0.14em] text-accent hover:underline">
            Signal
          </Link>
          <h1 className="mt-2 font-display text-h1 font-semibold leading-tight text-ink">
            {meta.name || "Project room"}
          </h1>
        </div>
        <button
          type="button"
          onClick={copyCode}
          className="rounded-lg border border-border bg-surface px-4 py-2 text-left shadow-card transition-colors hover:border-accent"
          title="Copy room code"
        >
          <div className="font-sans text-label uppercase tracking-[0.04em] text-ink-muted">
            Room code {copied ? "· copied!" : "· tap to copy"}
          </div>
          <div className="font-mono text-[1.25rem] font-semibold tracking-[0.18em] text-ink">
            {code}
          </div>
        </button>
      </div>

      <p className="mt-3 text-[0.9375rem] text-ink-muted">
        Share this code so others can join and add what they know.{" "}
        <span className="text-ink">{contributions.length}</span> message
        {contributions.length === 1 ? "" : "s"} so far.
      </p>

      {/* Add form */}
      <section className="mt-8 rounded-card border border-border bg-surface p-5 shadow-card">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr]">
          <label className="block">
            <span className="font-sans text-label font-medium uppercase tracking-[0.04em] text-ink-muted">
              Your name
            </span>
            <input
              value={name}
              onChange={(e) => rememberName(e.target.value)}
              placeholder="e.g. Priya"
              className="mt-1 w-full rounded-lg border border-border bg-paper px-3 py-2 font-sans text-[0.9375rem] text-ink outline-none focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="font-sans text-label font-medium uppercase tracking-[0.04em] text-ink-muted">
              Channel
            </span>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as (typeof CHANNEL_OPTIONS)[number])}
              className="mt-1 w-full rounded-lg border border-border bg-paper px-3 py-2 font-sans text-[0.9375rem] text-ink outline-none focus:border-accent"
            >
              {CHANNEL_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-3 block">
          <span className="font-sans text-label font-medium uppercase tracking-[0.04em] text-ink-muted">
            What do you know?
          </span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="e.g. Supplier says Shade 312 is unavailable, lead time unknown."
            className="mt-1 w-full resize-y rounded-lg border border-border bg-paper p-3 font-sans text-[0.9375rem] leading-relaxed text-ink outline-none focus:border-accent"
          />
        </label>

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={addContribution}
            disabled={sending || !text.trim() || !name.trim()}
            className="rounded-lg bg-accent px-4 py-2 font-sans text-[0.9375rem] font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-40"
          >
            {sending ? "Adding…" : "Add to room"}
          </button>
          {!name.trim() && (
            <span className="text-[0.875rem] text-ink-muted">Enter your name first.</span>
          )}
        </div>
      </section>

      {/* Feed */}
      <section className="mt-8">
        <div className="mb-3 font-sans text-label font-medium uppercase tracking-[0.04em] text-ink-muted">
          Room feed
        </div>
        {contributions.length === 0 ? (
          <p className="rounded-card border border-dashed border-border bg-surface p-6 text-center text-ink-muted">
            No messages yet. Add the first one above, or share the code{" "}
            <span className="font-mono text-ink">{code}</span>.
          </p>
        ) : (
          <ul className="space-y-2">
            {contributions.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-border bg-surface p-3 shadow-card"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded bg-[color-mix(in_srgb,var(--ink)_7%,transparent)] px-1.5 py-0.5 font-mono text-[0.75rem] font-medium text-ink-muted">
                    {c.channel}
                  </span>
                  <span className="font-sans text-[0.875rem] font-semibold text-ink">
                    {c.author}
                  </span>
                </div>
                <p className="font-sans text-[0.9375rem] leading-relaxed text-ink">
                  {c.text}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Analyse */}
      <section className="mt-8 border-t border-border pt-8">
        <button
          type="button"
          onClick={analyseRoom}
          disabled={analysis.state === "loading" || contributions.length === 0}
          className="accent-underline rounded-lg bg-ink px-5 py-2.5 font-sans text-[0.9375rem] font-semibold text-paper transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {analysis.state === "loading" ? "Analysing room…" : "Analyse room"}
        </button>

        <div className="mt-6" aria-live="polite">
          {analysis.state === "loading" && <LoadingCards />}
          {analysis.state === "error" && (
            <div className="rounded-card border border-border bg-surface p-6 shadow-card">
              <p className="text-ink">{analysis.message}</p>
              <button
                type="button"
                onClick={analyseRoom}
                className="mt-3 font-sans text-[0.9375rem] font-semibold text-accent hover:underline"
              >
                Retry
              </button>
            </div>
          )}
          {analysis.state === "result" && <DecisionList data={analysis.data} />}
        </div>
      </section>
    </main>
  );
}
