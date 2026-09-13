"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RoomsEntry() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createRoom() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms", { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.meta?.code) {
        setError(body?.error ?? "Couldn't create a room. Retry.");
        return;
      }
      router.push(`/room/${body.meta.code}`);
    } catch {
      setError("Couldn't reach the server. Retry.");
    } finally {
      setBusy(false);
    }
  }

  function joinRoom() {
    const c = code.trim().toUpperCase();
    if (!c) return;
    router.push(`/room/${c}`);
  }

  return (
    <div>
      <div className="mb-1 font-sans text-label font-semibold uppercase tracking-[0.14em] text-ink-muted">
        Collaborate
      </div>
      <h2 className="font-display text-h2 font-medium text-ink">
        Open a room, pull in the whole team.
      </h2>
      <p className="mt-2 max-w-[52ch] text-[0.9375rem] leading-relaxed text-ink-muted">
        Create a room and share the code. Everyone drops in what they know from
        their channel — then one click finds the buried decision across all of
        it.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={createRoom}
          disabled={busy}
          className="rounded-lg border border-accent bg-accent px-5 py-2.5 font-sans text-[0.9375rem] font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-40"
        >
          {busy ? "Creating…" : "Create a room"}
        </button>

        <span className="font-sans text-label uppercase tracking-[0.04em] text-ink-muted">
          or
        </span>

        <div className="flex items-center gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && joinRoom()}
            placeholder="ENTER CODE"
            maxLength={8}
            aria-label="Room code"
            className="w-36 rounded-lg border border-border bg-surface px-3 py-2.5 font-mono text-source uppercase tracking-[0.12em] text-ink outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={joinRoom}
            disabled={!code.trim()}
            className="rounded-lg border border-border bg-surface px-4 py-2.5 font-sans text-[0.9375rem] font-semibold text-ink transition-colors hover:border-accent disabled:opacity-40"
          >
            Join
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-3 text-[0.9375rem] text-[var(--status-contra)]">{error}</p>
      )}
    </div>
  );
}
