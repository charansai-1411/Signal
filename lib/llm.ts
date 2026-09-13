/**
 * Minimal LLM client — dependency-free fetch to an OpenAI-compatible
 * chat/completions endpoint, at temperature 0.1 (PRD §5, §10). No SDK.
 *
 * Providers are tried in order and the client FALLS BACK on transient failures
 * (HTTP 429 rate limits or 5xx / network errors):
 *   1. Groq (GROQ_API_KEY) — preferred. Fast; free open-source models
 *      (default qwen/qwen3.8-27b). Supports response_format json_object.
 *      Free tier is ~8k tokens/min, so we keep max_tokens modest.
 *   2. OpenRouter (OPENROUTER_API_KEY) — fallback. Slower free pool, but keeps
 *      the demo alive when Groq is rate-limited.
 *
 * A non-transient error (e.g. 400/401) throws immediately — no point retrying
 * a bad request on another provider. All output is validated downstream with
 * fence-stripping + Zod + one retry in the pipeline.
 */

export class LLMError extends Error {}

// Modest cap: our largest stage output (signals for a busy room) is well under
// this, and staying small keeps single calls inside Groq's per-minute token
// budget so we don't self-inflict 429s.
const MAX_TOKENS = 3072;

type Provider = {
  name: string;
  endpoint: string;
  apiKey: string;
  model: string;
  jsonMode: boolean;
  extraHeaders?: Record<string, string>;
};

function providers(): Provider[] {
  const list: Provider[] = [];
  if (process.env.GROQ_API_KEY) {
    list.push({
      name: "groq",
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
      jsonMode: true,
    });
  }
  if (process.env.OPENROUTER_API_KEY) {
    list.push({
      name: "openrouter",
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      apiKey: process.env.OPENROUTER_API_KEY,
      model:
        process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-super-120b-a12b:free",
      jsonMode: false,
      extraHeaders: {
        "HTTP-Referer": "https://github.com/charansai-1411/Signal",
        "X-Title": "Signal",
      },
    });
  }
  return list;
}

/** A failure the next provider might handle: rate limit, server error, network. */
class TransientError extends Error {}

async function callOne(
  p: Provider,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const body = {
    model: p.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.1,
    max_tokens: MAX_TOKENS,
    ...(p.jsonMode ? { response_format: { type: "json_object" } } : {}),
  };

  let res: Response;
  try {
    res = await fetch(p.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${p.apiKey}`,
        "Content-Type": "application/json",
        ...(p.extraHeaders ?? {}),
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new TransientError(`[${p.name}] network error: ${String(e)}`);
  }

  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 400);
    const msg = `[${p.name}] HTTP ${res.status}: ${detail}`;
    if (res.status === 429 || res.status >= 500) throw new TransientError(msg);
    throw new LLMError(msg); // 4xx (bad request/auth) — don't fall back
  }

  const data = (await res.json().catch(() => null)) as any;
  const text: string | undefined = data?.choices?.[0]?.message?.content;
  if (!text) {
    const reason = data?.choices?.[0]?.finish_reason;
    throw new TransientError(
      `[${p.name}] no text${reason ? ` (finish_reason: ${reason})` : ""}`,
    );
  }
  return stripFences(text).trim();
}

/**
 * Send a system + user prompt and return the raw response text (a JSON string).
 * Tries each configured provider in order, falling back on transient errors.
 */
export async function callLLMJSON(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const list = providers();
  if (list.length === 0) {
    throw new LLMError(
      "No LLM API key set on the server (expected GROQ_API_KEY or OPENROUTER_API_KEY).",
    );
  }

  let lastTransient: unknown;
  for (const p of list) {
    try {
      return await callOne(p, systemPrompt, userPrompt);
    } catch (e) {
      if (e instanceof TransientError) {
        lastTransient = e;
        console.warn(`[llm] ${e.message} — falling back to next provider`);
        continue;
      }
      throw e; // non-transient: surface immediately
    }
  }
  throw new LLMError(
    `All providers failed. Last error: ${String((lastTransient as Error)?.message ?? lastTransient)}`,
  );
}

/** Defensive: some models wrap JSON in ```json fences. */
function stripFences(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fence ? fence[1] : text;
}
