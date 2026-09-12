import { z } from "zod";

/**
 * Zod schemas for the two-stage pipeline (PRD §6, §7).
 *
 * The LLM is instructed to return exact enum values, but a live demo must not
 * die because the model capitalised "email" or invented an act. So each
 * constrained field is coerced: a recognised value passes through, anything
 * else falls back to the safe neutral ("Unknown" / null / "other"). Structure
 * is validated strictly; vocabulary is forgiving.
 */

export const CHANNELS = [
  "WhatsApp",
  "Email",
  "Site",
  "Client",
  "Supplier",
  "Drawings",
  "Unknown",
] as const;

export const ROLES = [
  "Architect",
  "Client",
  "Contractor",
  "Supplier",
  "Consultant",
] as const;

export const ACTS = [
  "approval",
  "rejection",
  "query",
  "update",
  "unavailability",
  "instruction",
  "other",
] as const;

export const STATUSES = ["RESOLVED", "BLOCKED", "CONTRADICTION", "OPEN"] as const;

export type Channel = (typeof CHANNELS)[number];
export type Role = (typeof ROLES)[number];
export type Act = (typeof ACTS)[number];
export type Status = (typeof STATUSES)[number];

/** Case-insensitive match against an allowed set, else a fallback. Preserves
 *  the literal union type of the allowed values. */
function coerceEnum<const T extends readonly [string, ...string[]]>(
  allowed: T,
  fallback: T[number] | null,
) {
  const lookup = new Map(allowed.map((v) => [v.toLowerCase(), v] as const));
  return z.preprocess((val) => {
    if (typeof val !== "string") return fallback;
    return lookup.get(val.trim().toLowerCase()) ?? fallback;
  }, z.enum(allowed).nullable());
}

/** Tolerate a missing/null array or a single string where a list is expected. */
const stringArray = z.preprocess((val) => {
  if (val == null) return [];
  if (Array.isArray(val)) return val.filter((v) => typeof v === "string");
  if (typeof val === "string") return [val];
  return [];
}, z.array(z.string()));

export const SignalSchema = z.object({
  id: z.string().min(1),
  channel: coerceEnum(CHANNELS, "Unknown").transform((v) => v ?? "Unknown"),
  sender_role: coerceEnum(ROLES, null),
  raw_text: z.string(),
  topic: z.string(),
  entities: stringArray,
  act: coerceEnum(ACTS, "other").transform((v) => v ?? "other"),
  references: stringArray,
});

export const ExtractorResponseSchema = z.object({
  signals: z.array(SignalSchema),
});

export const ContradictionSchema = z.object({
  detected: z.boolean(),
  explanation: z.string().default(""),
  signal_ids: stringArray,
});

export const DecisionSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  status: coerceEnum(STATUSES, "OPEN").transform((v) => v ?? "OPEN"),
  state_summary: z.string(),
  blocker: z.string().nullable().default(null),
  owner_role: coerceEnum(ROLES, null),
  contradiction: ContradictionSchema.nullable().default(null),
  source_signal_ids: stringArray,
});

export const ResolverResponseSchema = z.object({
  decisions: z.array(DecisionSchema),
});

export type Signal = z.infer<typeof SignalSchema>;
export type Decision = z.infer<typeof DecisionSchema>;
export type AnalyzeResponse = { decisions: Decision[]; signals: Signal[] };
