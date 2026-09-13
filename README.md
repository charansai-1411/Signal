# Signal

**Signal finds the decision buried inside the noise — and catches when two channels disagree.**

On any project, a single decision ("which marble for the master bathroom?") is scattered across six channels. Nobody is wrong, nothing is resolved, and two messages often **contradict each other** without anyone noticing — until it's built wrong. Signal reads the raw dump from every channel and tells you the one thing that matters: what's unresolved, why, who owns it, and where two people are talking past each other.

> Built for the ArchScale Guild Intern Technology Hackathon 2026 (AS-02 — "Make project communication intelligent, not overwhelming"). Solo · 3-day build.

## The concept

Not a summarizer. Not a chatbot. A tool that produces one **Decision Card** per open decision, each showing its status, current state, blocker, owner, the detected contradiction, and the exact source messages it was assembled from.

**Conflict detection across channels is the whole game.** Summarizers are a commodity; catching that "use the previous marble" (WhatsApp) and "refer Rev 04, the marble was updated" (Email) cannot both be true — before it gets installed wrong — is the point.

## Architecture

Single full-stack Next.js app. One repo, one deploy, no separate backend.

```
Browser (React UI)
      │  POST /api/analyze  { raw: string }
      ▼
Next.js API route (serverless, Node runtime)
      │  1. Extractor agent  → signals[]    (LLM, forced JSON, temp 0.1)
      │  2. Resolver agent   → decisions[]  (LLM, forced JSON, temp 0.1)
      │  3. Zod validation + one retry per stage on parse failure
      │  4. Server-side sort: contradiction → blocked → open → resolved
      ▼
JSON { decisions[], signals[] }  →  render Decision Cards
```

**Two explicit LLM calls, not an agent framework.** For a live demo, determinism mattered more than framework features: two sequential, well-specified calls with forced JSON output are more robust and faster to debug than an orchestration graph, and the judge sees the output, not the DAG. Temperature 0.1 + a hardcoded sample project make the demo reproducible every run.

The UI re-hydrates `source_signal_ids` and `contradiction.signal_ids` against the Stage-1 signals, so the raw evidence on screen is always the real extracted text — never re-generated.

## Tech stack

- **Next.js 14 (App Router) + React 18 + TypeScript**
- **Tailwind CSS** with the design tokens mapped to CSS variables in `app/globals.css`
- **`next/font/google`** — Fraunces (display) · Inter (UI) · JetBrains Mono (data)
- **LLM via Groq** (default `openai/gpt-oss-120b`, ~6–7s, chosen for free-tier rate-limit headroom), with **automatic fallback to OpenRouter** on rate limits — OpenAI-compatible JSON mode, temperature 0.1, one dependency-free `fetch`, no SDK
- **Zod** for response validation
- **Vercel** for deploy

## Run locally

```bash
npm install
cp .env.local.example .env.local   # then paste your OpenRouter key
npm run dev
```

Open http://localhost:3000 and click **Load sample project**.

Get a free Groq API key at https://console.groq.com/keys (no credit card required).

### Environment variables

The app picks its LLM provider from whichever key is set — **Groq preferred**, OpenRouter as fallback.

| Variable | Required | Default | Notes |
|---|---|---|---|
| `GROQ_API_KEY` | yes* | — | Preferred provider. Server-side only. Never committed (`.env.local` is gitignored). |
| `GROQ_MODEL` | no | `openai/gpt-oss-120b` | Override the Groq model. |
| `OPENROUTER_API_KEY` | yes* | — | Fallback provider (used only if `GROQ_API_KEY` is absent). |
| `OPENROUTER_MODEL` | no | `nvidia/nemotron-3-super-120b-a12b:free` | Override the OpenRouter model. |
| `UPSTASH_REDIS_REST_URL` | for rooms | — | Redis REST URL for the collaborative rooms feature. Without it, rooms fall back to an in-memory dev store (single process only — not viable on Vercel). |
| `UPSTASH_REDIS_REST_TOKEN` | for rooms | — | Redis REST token (pairs with the URL above). |

\* Set **one** LLM provider key (Groq or OpenRouter).

### Rooms (collaborative feature)

Beyond the single-screen paste flow, Signal supports **rooms**: create a room, share the 6-character code, and multiple people join (no login — just a display name) and each add what they know from their channel. **Analyse room** pools every contribution and runs the *same* extract→resolve pipeline, so the contradiction engine is unchanged — it just gets real multi-person input.

- Storage: Upstash Redis (REST) when configured; an in-memory `globalThis` fallback for local dev.
- Endpoints: `POST /api/rooms`, `GET /api/rooms/[code]`, `POST /api/rooms/[code]/contribute`, `POST /api/rooms/[code]/analyze`.
- The room page live-syncs the feed via light polling.

## Deploy (Vercel)

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add `GROQ_API_KEY` (and optionally `GROQ_MODEL`) as environment variables. For the rooms feature, also add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (the in-memory fallback does not persist across serverless invocations).
4. Deploy. `main` auto-deploys on push.

## API

`POST /api/analyze`
Request: `{ "raw": "<pasted text>" }`
- `200` → `{ "decisions": Decision[], "signals": Signal[] }`
- `422` → `{ "error": "Could not parse the messages. Try the sample project." }`
- `500` → `{ "error": "Something broke on our side. Retry." }`

## What AI helped with

The extract→resolve pipeline is the product. A free open-source LLM (via Groq) does the two intelligence stages (normalising messy text into structured signals, then clustering them into decisions and detecting contradictions). All orchestration, validation, sorting, and UI are deterministic application code.

## What I'd build next

- Live channel integrations (WhatsApp/Gmail/drawings) instead of paste-in.
- LangGraph orchestration once decisions branch into sub-decisions and need a real dependency graph.
- Demo history via `localStorage`.
