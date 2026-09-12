import { NextResponse } from "next/server";
import { z } from "zod";
import { callGeminiJSON, GeminiError } from "@/lib/gemini";
import {
  EXTRACTOR_SYSTEM,
  RESOLVER_SYSTEM,
  EXTRACTOR_RETRY_SUFFIX,
  RESOLVER_RETRY_SUFFIX,
} from "@/lib/prompts";
import {
  ExtractorResponseSchema,
  ResolverResponseSchema,
  type Signal,
  type Decision,
} from "@/lib/schema";
import { sortDecisions } from "@/lib/sort";

export const runtime = "nodejs";
export const maxDuration = 60;

const PARSE_ERROR = "Could not parse the messages. Try the sample project.";
const SERVER_ERROR = "Something broke on our side. Retry.";

/** Run one LLM stage: call, JSON.parse, Zod-validate. One retry on any failure. */
async function runStage<T>(
  system: string,
  user: string,
  schema: z.ZodType<T>,
  retrySuffix: string,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const sys = attempt === 0 ? system : system + retrySuffix;
    const raw = await callGeminiJSON(sys, user);
    try {
      const parsed = JSON.parse(raw);
      return schema.parse(parsed);
    } catch (e) {
      lastErr = e;
      // fall through to retry
    }
  }
  throw new ParseFailure(lastErr);
}

class ParseFailure extends Error {
  constructor(public cause: unknown) {
    super("Stage output failed validation after retry");
  }
}

export async function POST(req: Request) {
  let raw: string;
  try {
    const body = await req.json();
    raw = typeof body?.raw === "string" ? body.raw : "";
  } catch {
    return NextResponse.json({ error: PARSE_ERROR }, { status: 422 });
  }

  if (!raw.trim()) {
    return NextResponse.json({ error: PARSE_ERROR }, { status: 422 });
  }

  try {
    // Stage 1 — Extractor: raw text -> signals[]
    const { signals } = await runStage(
      EXTRACTOR_SYSTEM,
      raw,
      ExtractorResponseSchema,
      EXTRACTOR_RETRY_SUFFIX,
    );

    if (signals.length === 0) {
      return NextResponse.json({ error: PARSE_ERROR }, { status: 422 });
    }

    // Stage 2 — Resolver: signals[] -> decisions[]
    const { decisions } = await runStage(
      RESOLVER_SYSTEM,
      JSON.stringify({ signals }, null, 2),
      ResolverResponseSchema,
      RESOLVER_RETRY_SUFFIX,
    );

    const sorted = sortDecisions(decisions as Decision[]);

    return NextResponse.json({
      decisions: sorted,
      signals: signals as Signal[],
    });
  } catch (e) {
    if (e instanceof ParseFailure) {
      return NextResponse.json({ error: PARSE_ERROR }, { status: 422 });
    }
    if (e instanceof GeminiError) {
      // Surface a clean message; log the detail server-side only.
      console.error("[analyze] Gemini error:", e.message);
      return NextResponse.json({ error: SERVER_ERROR }, { status: 500 });
    }
    console.error("[analyze] Unexpected error:", e);
    return NextResponse.json({ error: SERVER_ERROR }, { status: 500 });
  }
}
