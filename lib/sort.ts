import type { Decision, Status } from "./schema";

/** Sort order per PRD §8: contradictions first, then blocked, open, resolved. */
const RANK: Record<Status, number> = {
  CONTRADICTION: 0,
  BLOCKED: 1,
  OPEN: 2,
  RESOLVED: 3,
};

export function sortDecisions(decisions: Decision[]): Decision[] {
  return [...decisions].sort((a, b) => RANK[a.status] - RANK[b.status]);
}
