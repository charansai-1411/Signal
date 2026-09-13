import type { AnalyzeResponse } from "./schema";

/**
 * Grounding checks — the guardrail against a hallucinating model.
 *
 * The pipeline's whole promise is that the evidence on screen is REAL: the
 * source trail and the side-by-side contradiction are re-hydrated from the
 * Stage-1 signals, and those signals must come from the actual pasted text.
 * These pure functions assert that invariant so it can be unit-tested and
 * measured against live output.
 */

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’'`]/g, "'")
    .replace(/[—–]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function words(s: string): string[] {
  return norm(s).split(" ").filter(Boolean);
}

/**
 * Is `text` grounded in `raw`? True if it appears verbatim (whitespace/quote
 * normalised) OR shares >= 80% of its words with the input. The fuzzy arm
 * tolerates trivial echoing differences while still catching fabricated text.
 */
export function isGrounded(text: string, raw: string): boolean {
  const nText = norm(text);
  if (nText.length === 0) return false;
  if (norm(raw).includes(nText)) return true;

  const tw = words(text);
  if (tw.length === 0) return false;
  const rawWords = new Set(words(raw));
  const shared = tw.filter((w) => rawWords.has(w)).length;
  return shared / tw.length >= 0.8;
}

export type GroundingReport = { ok: boolean; violations: string[] };

/**
 * Validate that an AnalyzeResponse is grounded in the raw input:
 *  - every signal's raw_text traces back to the pasted text (no invented evidence)
 *  - every decision's source/contradiction ids reference real signals
 *  - a detected contradiction cites >= 2 signals that belong to the decision,
 *    and status/payload agree.
 */
export function checkGrounding(res: AnalyzeResponse, raw: string): GroundingReport {
  const violations: string[] = [];
  const ids = new Set(res.signals.map((s) => s.id));

  if (ids.size !== res.signals.length) violations.push("duplicate signal ids");

  for (const s of res.signals) {
    if (!isGrounded(s.raw_text, raw)) {
      violations.push(
        `signal ${s.id}: raw_text not grounded in input — "${s.raw_text.slice(0, 60)}"`,
      );
    }
  }

  for (const d of res.decisions) {
    for (const id of d.source_signal_ids) {
      if (!ids.has(id)) {
        violations.push(`decision ${d.id}: source references unknown signal ${id}`);
      }
    }

    const c = d.contradiction;
    if (c && c.detected) {
      if (d.status !== "CONTRADICTION") {
        violations.push(
          `decision ${d.id}: contradiction detected but status is ${d.status}`,
        );
      }
      if (c.signal_ids.length < 2) {
        violations.push(
          `decision ${d.id}: contradiction cites ${c.signal_ids.length} signal(s), needs >= 2`,
        );
      }
      for (const id of c.signal_ids) {
        if (!ids.has(id)) {
          violations.push(`decision ${d.id}: contradiction references unknown signal ${id}`);
        } else if (!d.source_signal_ids.includes(id)) {
          violations.push(
            `decision ${d.id}: contradiction signal ${id} is not among the decision's sources`,
          );
        }
      }
    }

    if (d.status === "CONTRADICTION" && !(c && c.detected)) {
      violations.push(`decision ${d.id}: status CONTRADICTION but no contradiction payload`);
    }
  }

  return { ok: violations.length === 0, violations };
}
