import { z } from "zod";
import { callLLMJSON, LLMError } from "@/lib/llm";
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
  type AnalyzeResponse,
} from "@/lib/schema";
import { sortDecisions } from "@/lib/sort";
import { checkGrounding } from "@/lib/grounding";

export const PARSE_ERROR = "Could not parse the messages. Try the sample project.";
export const SERVER_ERROR = "Something broke on our side. Retry.";

export type AnalyzeResult =
  | { ok: true; data: AnalyzeResponse }
  | { ok: false; status: 422 | 500; error: string };

class ParseFailure extends Error {
  constructor(public cause: unknown) {
    super("Stage output failed validation after retry");
  }
}

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
    const raw = await callLLMJSON(sys, user);
    try {
      return schema.parse(JSON.parse(raw));
    } catch (e) {
      lastErr = e;
      // fall through to retry
    }
  }
  throw new ParseFailure(lastErr);
}

/**
 * The two-stage extract -> resolve pipeline (PRD §5, §6). Shared by the paste
 * flow (/api/analyze) and the rooms flow (/api/rooms/[code]/analyze) so there
 * is exactly one contradiction engine.
 */
export async function analyze(raw: string): Promise<AnalyzeResult> {
  if (!raw.trim()) {
    return { ok: false, status: 422, error: PARSE_ERROR };
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
      return { ok: false, status: 422, error: PARSE_ERROR };
    }

    // Stage 2 — Resolver: signals[] -> decisions[]
    const { decisions } = await runStage(
      RESOLVER_SYSTEM,
      JSON.stringify({ signals }, null, 2),
      ResolverResponseSchema,
      RESOLVER_RETRY_SUFFIX,
    );

    const data = {
      decisions: sortDecisions(decisions as Decision[]),
      signals: signals as Signal[],
    };

    // Grounding guardrail (observability): the UI only ever renders real
    // extracted signals, but if the model drifts we want to know.
    const grounding = checkGrounding(data, raw);
    if (!grounding.ok) {
      console.warn("[analyze] grounding violations:", grounding.violations);
    }

    return { ok: true, data };
  } catch (e) {
    if (e instanceof ParseFailure) {
      return { ok: false, status: 422, error: PARSE_ERROR };
    }
    if (e instanceof LLMError) {
      console.error("[analyze] LLM error:", e.message);
      return { ok: false, status: 500, error: SERVER_ERROR };
    }
    console.error("[analyze] Unexpected error:", e);
    return { ok: false, status: 500, error: SERVER_ERROR };
  }
}
