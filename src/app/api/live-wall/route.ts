import { NextResponse } from "next/server";
import { getPublicData } from "@/lib/data";
import { hideSubmissionUrls } from "@/lib/live-wall";

export async function GET() {
  const result = await getPublicData();
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json({ ok: true, data: hideSubmissionUrls(result.data) }, { headers: { "Cache-Control": "no-store" } });
}
