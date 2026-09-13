import { NextResponse } from "next/server";
import { getRoom } from "@/lib/store";

export const runtime = "nodejs";

// GET /api/rooms/[code]  ->  { meta, contributions }  | 404
export async function GET(
  _req: Request,
  { params }: { params: { code: string } },
) {
  try {
    const room = await getRoom(params.code);
    if (!room) {
      return NextResponse.json({ error: "Room not found." }, { status: 404 });
    }
    return NextResponse.json(room);
  } catch (e) {
    console.error("[rooms] get failed:", e);
    return NextResponse.json(
      { error: "Couldn't load the room. Retry." },
      { status: 500 },
    );
  }
}
