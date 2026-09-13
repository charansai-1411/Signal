/**
 * Room storage for the collaborative feature.
 *
 * Two backends, chosen at runtime:
 *  - Upstash Redis (REST) when UPSTASH_REDIS_REST_URL + _TOKEN are set. This is
 *    the real backend: shared across devices and serverless invocations, so it
 *    works on Vercel.
 *  - An in-memory Map fallback otherwise. Fine for a single local dev process
 *    (one machine, one `next dev`), but it does NOT persist across Vercel
 *    serverless invocations — so a deployed build without Upstash env vars will
 *    appear to "lose" rooms. We warn loudly when this path is used.
 */

import type { Channel } from "@/lib/schema";

export type Contribution = {
  id: string;
  author: string;
  channel: Channel;
  text: string;
  ts: number;
};

export type RoomMeta = { code: string; name: string | null; createdAt: number };
export type Room = { meta: RoomMeta; contributions: Contribution[] };

const URL_ = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const USE_UPSTASH = Boolean(URL_ && TOKEN);

const ROOM_TTL_SECONDS = 60 * 60 * 24; // rooms auto-expire after 24h
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O/1/I/L

let warnedMemory = false;
function warnMemoryOnce() {
  if (!warnedMemory) {
    warnedMemory = true;
    console.warn(
      "[store] Using in-memory room store (no Upstash env). Dev-only: state is per-process and will NOT survive on Vercel. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for real multi-device rooms.",
    );
  }
}

/* ------------------------------ Upstash REST ------------------------------ */

async function redis(cmd: (string | number)[]): Promise<any> {
  const res = await fetch(URL_!, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Upstash ${res.status}: ${detail.slice(0, 300)}`);
  }
  const data = (await res.json()) as { result?: unknown; error?: string };
  if (data.error) throw new Error(`Upstash error: ${data.error}`);
  return data.result;
}

/* ------------------------------ Memory store ------------------------------ */

// Hang the Map off globalThis so every route bundle in the same Node process
// shares ONE instance (Next.js compiles each route separately, so a plain
// module-level Map would be duplicated per route). This makes the dev fallback
// work across create/contribute/analyze. It still does NOT persist across
// separate Vercel invocations — that's what Upstash is for.
const g = globalThis as unknown as { __signalRooms?: Map<string, Room> };
const mem = (g.__signalRooms ??= new Map<string, Room>());
const metaKey = (code: string) => `room:${code}:meta`;
const listKey = (code: string) => `room:${code}:contribs`;

/* -------------------------------- Public API ------------------------------ */

function randomCode(len = 6): string {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export async function roomExists(code: string): Promise<boolean> {
  const c = normalizeCode(code);
  if (USE_UPSTASH) return (await redis(["EXISTS", metaKey(c)])) === 1;
  warnMemoryOnce();
  return mem.has(c);
}

export async function createRoom(name?: string): Promise<RoomMeta> {
  // Find a free code (a couple of tries is astronomically enough).
  let code = randomCode();
  for (let i = 0; i < 5 && (await roomExists(code)); i++) code = randomCode();

  const meta: RoomMeta = {
    code,
    name: name?.trim() ? name.trim().slice(0, 80) : null,
    createdAt: Date.now(),
  };

  if (USE_UPSTASH) {
    await redis(["SET", metaKey(code), JSON.stringify(meta)]);
    await redis(["EXPIRE", metaKey(code), ROOM_TTL_SECONDS]);
  } else {
    warnMemoryOnce();
    mem.set(code, { meta, contributions: [] });
  }
  return meta;
}

export async function getRoom(code: string): Promise<Room | null> {
  const c = normalizeCode(code);
  if (USE_UPSTASH) {
    const metaRaw = (await redis(["GET", metaKey(c)])) as string | null;
    if (!metaRaw) return null;
    const meta = JSON.parse(metaRaw) as RoomMeta;
    const rows = ((await redis(["LRANGE", listKey(c), 0, -1])) as string[]) || [];
    const contributions = rows.map((r) => JSON.parse(r) as Contribution);
    return { meta, contributions };
  }
  warnMemoryOnce();
  return mem.get(c) ?? null;
}

export async function addContribution(
  code: string,
  input: { author: string; channel: Channel; text: string },
): Promise<Contribution | null> {
  const c = normalizeCode(code);
  if (!(await roomExists(c))) return null;

  const contribution: Contribution = {
    id: `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    author: input.author.trim().slice(0, 60) || "Anonymous",
    channel: input.channel,
    text: input.text.trim().slice(0, 2000),
    ts: Date.now(),
  };

  if (USE_UPSTASH) {
    await redis(["RPUSH", listKey(c), JSON.stringify(contribution)]);
    // Keep the contribution list on the same TTL as the room.
    await redis(["EXPIRE", listKey(c), ROOM_TTL_SECONDS]);
    await redis(["EXPIRE", metaKey(c), ROOM_TTL_SECONDS]);
  } else {
    warnMemoryOnce();
    mem.get(c)!.contributions.push(contribution);
  }
  return contribution;
}

/** Turn a room's contributions into the raw dump the pipeline expects. */
export function contributionsToRaw(contributions: Contribution[]): string {
  return contributions
    .map((c) => `${c.channel} — ${c.author}: ${c.text}`)
    .join("\n");
}

export const storeMode = USE_UPSTASH ? "upstash" : "memory";
