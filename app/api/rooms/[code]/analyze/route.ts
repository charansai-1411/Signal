import { NextResponse } from "next/server";
import { getRoom, contributionsToRaw } from "@/lib/store";
import { analyze } from "@/lib/pipeline";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST /api/rooms/[code]/analyze  ->  { decisions, signals } | 404 | 422 | 500
// Pools every contribution in the room and runs the SAME extract->resolve
// pipeline as the paste flow. The contradiction engine is untouched.
export async function POST(
  _req: Request,
  { params }: { params: { code: string } },
) {
  let room;
  try {
    room = await getRoom(params.code);
  } catch (e) {
    console.error("[rooms] analyze load failed:", e);
    return NextResponse.json(
      { error: "Couldn't load the room. Retry." },
      { status: 500 },
    );
  }

  if (!room) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }
  if (room.contributions.length === 0) {
    return NextResponse.json(
      { error: "No messages yet. Add some, then analyse." },
      { status: 422 },
    );
  }

  const raw = contributionsToRaw(room.contributions);
  const result = await analyze(raw);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data);
}
