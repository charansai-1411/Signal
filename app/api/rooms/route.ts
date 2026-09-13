import { NextResponse } from "next/server";
import { createRoom } from "@/lib/store";

export const runtime = "nodejs";

// POST /api/rooms  { name?: string }  ->  { meta }
export async function POST(req: Request) {
  let name: string | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    name = typeof body?.name === "string" ? body.name : undefined;
  } catch {
    name = undefined;
  }

  try {
    const meta = await createRoom(name);
    return NextResponse.json({ meta }, { status: 201 });
  } catch (e) {
    console.error("[rooms] create failed:", e);
    return NextResponse.json(
      { error: "Couldn't create the room. Retry." },
      { status: 500 },
    );
  }
}
