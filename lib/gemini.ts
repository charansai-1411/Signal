/**
 * Minimal Gemini client — a single dependency-free fetch to the REST API in
 * JSON mode at temperature 0.1 (PRD §5, §10). No SDK: one thing that can fail.
 */

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

export class GeminiError extends Error {}

/**
 * Send a system + user prompt to Gemini in JSON mode and return the raw text
 * of the response (expected to be a JSON string). Throws GeminiError on any
 * transport/API failure.
 */
export async function callGeminiJSON(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiError("GEMINI_API_KEY is not set on the server.");
  }

  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
      maxOutputTokens: 8192,
    },
  };

  let res: Response;
  try {
    res = await fetch(`${ENDPOINT(MODEL)}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new GeminiError(`Network error calling Gemini: ${String(e)}`);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new GeminiError(
      `Gemini API returned ${res.status}: ${detail.slice(0, 500)}`,
    );
  }

  const data = (await res.json().catch(() => null)) as any;
  const text: string | undefined =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: any) => p?.text ?? "")
      .join("") ?? undefined;

  if (!text) {
    const finish = data?.candidates?.[0]?.finishReason;
    throw new GeminiError(
      `Gemini returned no text${finish ? ` (finishReason: ${finish})` : ""}.`,
    );
  }

  return stripFences(text).trim();
}

/** Defensive: models sometimes wrap JSON in ```json fences despite JSON mode. */
function stripFences(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fence ? fence[1] : text;
}
