/**
 * Sample projects for the dashboard's "Load a sample" picker. Each is a raw
 * multi-channel dump with a buried decision and, in most, a contradiction —
 * the thing Signal is built to catch. The launch-date scenario is the default
 * (it mirrors the landing page). A spread of domains shows the tool isn't
 * construction-only.
 */

export type Sample = { id: string; name: string; text: string };

export const SAMPLES: Sample[] = [
  {
    id: "launch",
    name: "Product launch date",
    text: `WhatsApp — Ravi (PM): Let's keep the launch on Friday the 12th, everyone's aligned.
Email — Meera (Marketing): Heads up — we moved the launch to Monday the 15th. Do NOT use Friday in any comms.
Slack — Dev team: Build is green, we can ship whenever you say.
Client — Acme: Approved the plan, just tell us the final date.
Calendar — Events: Press briefing is already booked for the 12th.
Email — Finance: Budget for the launch event is signed off.
Slack — Priya (Design): Launch assets are ready to hand over.`,
  },
  {
    id: "deploy",
    name: "Production deployment",
    text: `Slack — Arjun (Lead): Ship v2.3 to production today at 5pm, everything's merged.
Email — Sneha (QA): Hold on — QA found a payment bug on staging. Do not deploy until it's fixed.
WhatsApp — Ravi (DevOps): Pipeline is ready, I can push the button anytime.
Client — Acme: We were promised the new checkout goes live today.
Slack — Arjun (Lead): The bug isn't reproducible on my machine, let's just proceed at 5.
Email — Sneha (QA): I can reproduce it every single time on staging. This is a blocker.`,
  },
  {
    id: "hiring",
    name: "Candidate offer",
    text: `WhatsApp — Neha (Hiring Manager): Let's send the offer to Karthik at 18 LPA, he's our top pick.
Email — Finance: Budget for this role was approved at 15 LPA maximum. Please stay within it.
Slack — Recruiter: Karthik has a competing offer, we need to move fast.
Email — Neha: He won't accept below 17 — the other offer is at 18.
Slack — HR Ops: Once you confirm the final number I'll generate the letter.`,
  },
  {
    id: "catering",
    name: "Wedding catering count",
    text: `WhatsApp — Anita: Final headcount is 120. I've locked it with the caterer.
Email — Dad: I already confirmed 150 to the venue and paid the per-plate charge for 150.
SMS — Caterer: We're prepped for 120, exactly as Anita told us.
Email — Venue: We have you down for 150 — that's what we're setting up the hall for.
WhatsApp — Anita: It's 120, not 150. Please don't change it.`,
  },
  {
    id: "brand",
    name: "Campaign logo colour",
    text: `Slack — Sam (Designer): I'll use the blue logo on the billboard, same as last year.
Email — Brand team: Reminder — brand guidelines were updated. The logo is green now, do not use blue.
WhatsApp — Sam: But the client said they loved the blue version.
Client — Acme: Approved the concept, go ahead and print.
Email — Print vendor: We need final artwork by tomorrow morning to hit the deadline.`,
  },
  {
    id: "trip",
    name: "Team offsite dates",
    text: `WhatsApp — Kiran: I booked the resort for the 10th–12th, deposit is paid.
Email — HR: Note the offsite moved to the 17th–19th after the board meeting clash.
Slack — Team: Half of us already have flights for the 10th.
Email — Finance: The deposit for the 10th is non-refundable.
WhatsApp — Kiran: So are we the 10th or the 17th? I have to tell the resort today.`,
  },
  {
    id: "menu",
    name: "Event menu",
    text: `WhatsApp — Chef: Keep the paneer tikka as the signature starter.
Email — Client: We told you the event is fully vegan now — no dairy, so no paneer.
SMS — Supplier: Paneer order confirmed for 200 plates.
Slack — Manager: Client approved the rest of the menu, only the starter is open.
Email — Chef: Paneer is our best seller, I'd rather not drop it.`,
  },
  {
    id: "reno",
    name: "Kitchen countertop",
    text: `WhatsApp — Contractor: Going with the granite countertop as we discussed on site.
Email — Designer: Please check Rev 2 — we switched to quartz, granite is out.
Site — Installer: Need to order the slab today. Which material is final?
Client — Homeowner: Approved the kitchen except the countertop.
Supplier — StoneCo: Heads up, the granite you asked about is back-ordered 3 weeks.`,
  },
  {
    id: "marble",
    name: "Bathroom marble (construction)",
    text: `WhatsApp — Rakesh (site engineer): For the master bathroom, just use the previous marble. Same as before, no need to change anything.
Email — Priya (architect): Team, please refer Rev 04 for the master bathroom — the marble selection was updated there, do not use the old one.
Site — Suresh (contractor): Contractor needs clarification on the bathroom stone before we can lay it. Which one is final?
Client — Mr. Menon: Approved everything except the master bathroom. Sort that out and we're good.
Supplier — StoneWorks: Update on the marble order — Shade 312 is currently unavailable, lead time unknown.
Drawings — CAD team: Rev 05 uploaded to the shared folder, supersedes earlier revisions.`,
  },
];

/** Default sample (mirrors the landing page). */
export const SAMPLE_PROJECT = SAMPLES[0].text;
