import { test } from "node:test";
import assert from "node:assert/strict";
import { checkGrounding, isGrounded } from "../lib/grounding.ts";

const RAW = `WhatsApp — Ravi: let's keep the launch on Friday the 12th
Email — Meera: we moved it to Monday the 15th, not Friday`;

// A well-formed, fully grounded response (what a good model returns).
const GOOD = {
  signals: [
    { id: "s1", channel: "WhatsApp", sender_role: null, raw_text: "WhatsApp — Ravi: let's keep the launch on Friday the 12th", topic: "launch date", entities: ["Friday"], act: "instruction", references: [] },
    { id: "s2", channel: "Email", sender_role: null, raw_text: "Email — Meera: we moved it to Monday the 15th, not Friday", topic: "launch date", entities: ["Monday"], act: "update", references: [] },
  ],
  decisions: [
    { id: "d1", title: "Launch date", status: "CONTRADICTION", state_summary: "x", blocker: null, owner_role: null, contradiction: { detected: true, explanation: "Friday vs Monday", signal_ids: ["s1", "s2"] }, source_signal_ids: ["s1", "s2"] },
  ],
};

test("isGrounded: verbatim text is grounded", () => {
  assert.equal(isGrounded("we moved it to Monday the 15th", RAW), true);
});

test("isGrounded: whitespace/case/quote differences still ground", () => {
  assert.equal(isGrounded("WE  MOVED it to Monday the 15th", RAW), true);
});

test("isGrounded: fabricated text is NOT grounded", () => {
  assert.equal(isGrounded("we cancelled the launch entirely and refunded everyone", RAW), false);
});

test("checkGrounding: a good response passes", () => {
  const r = checkGrounding(GOOD, RAW);
  assert.equal(r.ok, true, r.violations.join("; "));
});

test("checkGrounding: fabricated raw_text is caught", () => {
  const bad = structuredClone(GOOD);
  bad.signals[0].raw_text = "WhatsApp — Ravi: budget doubled to 40 lakh";
  const r = checkGrounding(bad, RAW);
  assert.equal(r.ok, false);
  assert.match(r.violations.join(" "), /not grounded/);
});

test("checkGrounding: contradiction citing a non-existent signal is caught", () => {
  const bad = structuredClone(GOOD);
  bad.decisions[0].contradiction.signal_ids = ["s1", "s9"]; // s9 doesn't exist
  const r = checkGrounding(bad, RAW);
  assert.equal(r.ok, false);
  assert.match(r.violations.join(" "), /unknown signal s9/);
});

test("checkGrounding: contradiction with a single signal is caught", () => {
  const bad = structuredClone(GOOD);
  bad.decisions[0].contradiction.signal_ids = ["s1"];
  const r = checkGrounding(bad, RAW);
  assert.equal(r.ok, false);
  assert.match(r.violations.join(" "), /needs >= 2/);
});

test("checkGrounding: status/contradiction mismatch is caught", () => {
  const bad = structuredClone(GOOD);
  bad.decisions[0].status = "OPEN"; // but contradiction.detected is true
  const r = checkGrounding(bad, RAW);
  assert.equal(r.ok, false);
  assert.match(r.violations.join(" "), /status is OPEN/);
});

test("checkGrounding: contradiction signal outside the decision's sources is caught", () => {
  const bad = structuredClone(GOOD);
  bad.decisions[0].source_signal_ids = ["s1"]; // s2 flagged but not a source
  const r = checkGrounding(bad, RAW);
  assert.equal(r.ok, false);
  assert.match(r.violations.join(" "), /not among the decision's sources/);
});
