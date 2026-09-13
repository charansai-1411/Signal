import { SAMPLES } from "../lib/sample.ts";

// Positives: a contradiction IS present. `terms` are the words that should show
// up across the flagged signals (checks it flagged the RIGHT pair, grounded).
const POSITIVE_TERMS = {
  launch: ["friday", "monday"],
  // deploy omitted from the right-pair check: it has two equally-valid
  // conflicting framings (ship-now vs do-not-deploy, and proceed vs blocker),
  // so a single fixed term set can't fairly score which pair was flagged.
  hiring: ["18", "15"],
  catering: ["120", "150"],
  brand: ["blue", "green"],
  trip: ["10", "17"],
  menu: ["paneer", "vegan"],
  reno: ["granite", "quartz"],
  marble: ["previous", "rev 04"],
};

export const POSITIVES = SAMPLES.map((s) => ({
  id: s.id,
  text: s.text,
  expectContradiction: true,
  terms: POSITIVE_TERMS[s.id] ?? [],
}));

// Negatives: the messages are CONSISTENT — a good model must NOT invent a
// contradiction. These measure the false-positive / hallucination rate.
export const NEGATIVES = [
  {
    id: "aligned",
    expectContradiction: false,
    text: `WhatsApp — Ravi: Launch is Friday the 12th, everyone good?
Email — Meera: Friday the 12th works for marketing.
Slack — Dev: Build will be ready by Thursday, no problem.
Client — Acme: Friday is perfect for us.`,
  },
  {
    id: "updates",
    expectContradiction: false,
    text: `Slack — Dev: Pushed the new API docs to the wiki.
Email — Design: Shared the updated icon set.
WhatsApp — PM: Standup is moved to 10am tomorrow.
Slack — QA: Regression suite is green.`,
  },
  {
    id: "clean-approve",
    expectContradiction: false,
    text: `Email — Client: Approved the final design, go ahead.
Supplier — Vendor: Stock is available, we can ship this week.
WhatsApp — PM: Great, placing the order today.
Slack — Team: Confirmed, kicking off production.`,
  },
  {
    id: "blocker-only",
    expectContradiction: false,
    text: `Supplier — Vendor: The part is out of stock, 2-week lead time.
WhatsApp — PM: Okay, we'll wait for it then.
Email — Client: Understood, keep us posted.
Slack — Team: Nothing else we can do until it arrives.`,
  },
  {
    id: "two-topics",
    expectContradiction: false,
    text: `Email — Client: Approved the logo, that's final.
WhatsApp — PM: Separately, the lunch venue is booked for Friday.
Slack — Design: Logo files exported and shared.
WhatsApp — Team: See everyone at the venue on Friday.`,
  },
];

// Edge cases: should be handled gracefully, never crash.
export const EDGES = [
  { id: "single", expectContradiction: false, text: `WhatsApp — Ravi: Are we still on for Friday?` },
  { id: "unrelated", expectContradiction: false, text: `SMS — Mom: Call me when you're free.
Slack — Bot: Deploy #412 succeeded.
Email — Newsletter: This week in tech.` },
];
