import { checkGrounding } from "../lib/grounding.ts";
import { POSITIVES, NEGATIVES, EDGES } from "./scenarios.mjs";

const BASE = process.env.EVAL_BASE || "http://localhost:3000";
const norm = (s) => s.toLowerCase().replace(/[’'`]/g, "'").replace(/\s+/g, " ");

async function analyze(text) {
  const res = await fetch(`${BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raw: text }),
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

function flaggedText(data) {
  const byId = Object.fromEntries((data.signals || []).map((s) => [s.id, s.raw_text]));
  const ids = new Set();
  for (const d of data.decisions || []) {
    if (d.contradiction?.detected) for (const id of d.contradiction.signal_ids) ids.add(id);
  }
  return [...ids].map((id) => byId[id] || "").join(" ");
}

async function run(list, label) {
  const rows = [];
  for (const sc of list) {
    let detected = false, grounded = null, rightPair = null, status = 0;
    try {
      const { status: st, data } = await analyze(sc.text);
      status = st;
      if (st === 200 && data) {
        detected = (data.decisions || []).some((d) => d.contradiction?.detected || d.status === "CONTRADICTION");
        grounded = checkGrounding(data, sc.text).ok;
        if (sc.terms?.length) {
          const ft = norm(flaggedText(data));
          rightPair = sc.terms.every((t) => ft.includes(norm(t)));
        }
      } else {
        // 422 on empty/no-signal input counts as "no contradiction", grounding n/a
        detected = false; grounded = true;
      }
    } catch (e) {
      status = -1;
    }
    const pass = detected === sc.expectContradiction;
    rows.push({ id: sc.id, status, detected, expect: sc.expectContradiction, pass, grounded, rightPair });
    const mark = pass ? "PASS" : "FAIL";
    const rp = rightPair === null ? "" : rightPair ? " pair:ok" : " pair:MISS";
    const gd = grounded === null ? "" : grounded ? " grounded:ok" : " grounded:BAD";
    console.log(`  [${label}] ${sc.id.padEnd(14)} ${mark}  detected=${detected} expect=${sc.expectContradiction}${rp}${gd}  (HTTP ${status})`);
    await new Promise((r) => setTimeout(r, Number(process.env.EVAL_DELAY || 900)));
  }
  return rows;
}

console.log(`Evaluating pipeline at ${BASE}\n`);
console.log("POSITIVES (contradiction expected):");
const pos = await run(POSITIVES, "pos");
console.log("\nNEGATIVES (no contradiction — hallucination test):");
const neg = await run(NEGATIVES, "neg");
console.log("\nEDGES (must not crash):");
const edge = await run(EDGES, "edge");

const all = [...pos, ...neg, ...edge];
const detRate = pos.filter((r) => r.detected).length / pos.length;
const rightPair = pos.filter((r) => r.rightPair);
const rightPairRate = pos.filter((r) => r.rightPair !== null).length
  ? rightPair.length / pos.filter((r) => r.rightPair !== null).length : 0;
const fpRate = neg.filter((r) => r.detected).length / neg.length;
const groundedConsidered = all.filter((r) => r.grounded !== null);
const groundedRate = groundedConsidered.length
  ? groundedConsidered.filter((r) => r.grounded).length / groundedConsidered.length : 1;
const crashes = all.filter((r) => r.status < 200 || r.status >= 500).length;

const pct = (x) => `${Math.round(x * 100)}%`;
console.log("\n================ SUMMARY ================");
console.log(`Contradiction recall (positives detected): ${pct(detRate)}  (${pos.filter((r) => r.detected).length}/${pos.length})`);
console.log(`Right-pair grounding (flagged the correct messages): ${pct(rightPairRate)}`);
console.log(`False-positive rate (negatives wrongly flagged): ${pct(fpRate)}  (${neg.filter((r) => r.detected).length}/${neg.length})`);
console.log(`Grounding pass rate (evidence traces to input): ${pct(groundedRate)}  (${groundedConsidered.filter((r) => r.grounded).length}/${groundedConsidered.length})`);
console.log(`Crashes / 5xx: ${crashes}`);
