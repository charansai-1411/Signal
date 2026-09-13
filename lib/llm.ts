/**
 * Minimal LLM client — a single dependency-free fetch to OpenRouter's
 * OpenAI-compatible chat/completions endpoint, at temperature 0.1 (PRD §5, §10).
 * No SDK: one thing that can fail.
 *
 * Provider is OpenRouter using a free open-source model (default: NVIDIA
 * Nemotron-3 Super 120B). The free model chosen does not support the
 * response_format JSON flag, so we force JSON purely via the system prompt and
 * guard with fence-stripping + Zod validation + one retry in the API route.
 */

const MODEL =
  process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-super-120b-a12b:free";
const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export class LLMError extends Error {}

/**
 * Send a system + user prompt and return the raw text of the response
 * (expected to be a JSON string). Throws LLMError on any transport/API failure.
 */
export async function callLLMJSON(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new LLMError("OPENROUTER_API_KEY is not set on the server.");
  }

  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.1,
    max_tokens: 8192,
  };

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // Optional OpenRouter attribution headers (harmless if unused).
        "HTTP-Referer": "https://github.com/charansai-1411/signal",
        "X-Title": "Signal",
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
