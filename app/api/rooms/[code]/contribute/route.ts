import { NextResponse } from "next/server";
import { addContribution } from "@/lib/store";
import { CHANNELS, type Channel } from "@/lib/schema";

export const runtime = "nodejs";

function coerceChannel(v: unknown): Channel {
  if (typeof v === "string") {
    const match = CHANNELS.find((c) => c.toLowerCase() === v.trim().toLowerCase());
    if (match) return match;
  }
  return "Unknown";
}

// POST /api/rooms/[code]/contribute  { author, channel, text }  ->  { contribution } | 404 | 422
export async function POST(
  req: Request,
  { params }: { params: { code: string } },
) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 422 });
  }

  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "Message is empty." }, { status: 422 });
  }

  try {
    const contribution = await addContribution(params.code, {
      author: typeof body?.author === "string" ? body.author : "Anonymous",
      channel: coerceChannel(body?.channel),
      text,
    });
    if (!contribution) {
      return NextResponse.json({ error: "Room not found." }, { status: 404 });
    }
    return NextResponse.json({ contribution }, { status: 201 });
  } catch (e) {
    console.error("[rooms] contribute failed:", e);
    return NextResponse.json(
      { error: "Couldn't add your message. Retry." },
      { status: 500 },
    );
  }
}
