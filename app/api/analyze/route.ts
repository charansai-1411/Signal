import { NextResponse } from "next/server";
import { analyze, PARSE_ERROR } from "@/lib/pipeline";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  let raw: string;
  try {
    const body = await req.json();
    raw = typeof body?.raw === "string" ? body.raw : "";
  } catch {
    return NextResponse.json({ error: PARSE_ERROR }, { status: 422 });
  }

  const result = await analyze(raw);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data);
}
