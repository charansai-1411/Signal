/**
 * Minimal LLM client — a single dependency-free fetch to an OpenAI-compatible
 * chat/completions endpoint, at temperature 0.1 (PRD §5, §10). No SDK.
 *
 * Provider is chosen from env at call time:
 *   - Groq (GROQ_API_KEY) — preferred. Fast; free open-source models
 *     (default: qwen/qwen3.8-27b). Supports response_format json_object.
 *   - OpenRouter (OPENROUTER_API_KEY) — fallback. Free open-source pool
 *     (default: nvidia/nemotron-3-super-120b-a12b:free); the free models there
 *     don't accept response_format, so JSON is forced via the prompt only.
 *
 * Both paths validate downstream with fence-stripping + Zod + one retry.
 */

export class LLMError extends Error {}

type Provider = {
  endpoint: string;
  apiKey: string;
  model: string;
  jsonMode: boolean;
  extraHeaders?: Record<string, string>;
};

function resolveProvider(): Provider {
  if (process.env.GROQ_API_KEY) {
    return {
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
      jsonMode: true,
    };
  }
  if (process.env.OPENROUTER_API_KEY) {
    return {
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      apiKey: process.env.OPENROUTER_API_KEY,
      model:
        process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-super-120b-a12b:free",
      jsonMode: false,
      extraHeaders: {
        "HTTP-Referer": "https://github.com/charansai-1411/Signal",
        "X-Title": "Signal",
      },
    };
  }
  throw new LLMError(
    "No LLM API key set on the server (expected GROQ_API_KEY or OPENROUTER_API_KEY).",
  );
}

/**
 * Send a system + user prompt and return the raw text of the response
 * (expected to be a JSON string). Throws LLMError on any transport/API failure.
 */
export async function callLLMJSON(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const p = resolveProvider();

  const body = {
    model: p.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.1,
    max_tokens: 8192,
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
    throw new LLMError(`Network error calling the model: ${String(e)}`);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new LLMError(
      `Model API returned ${res.status}: ${detail.slice(0, 500)}`,
    );
  }

  const data = (await res.json().catch(() => null)) as any;
  const text: string | undefined = data?.choices?.[0]?.message?.content;

  if (!text) {
    const reason = data?.choices?.[0]?.finish_reason;
    throw new LLMError(
      `Model returned no text${reason ? ` (finish_reason: ${reason})` : ""}.`,
    );
  }

  return stripFences(text).trim();
}

/** Defensive: some models wrap JSON in ```json fences. */
function stripFences(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fence ? fence[1] : text;
}
