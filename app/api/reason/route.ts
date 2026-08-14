import { NextResponse } from "next/server";
import { generateReason, type ReasonInput } from "@/lib/claude";
import type { Purpose } from "@/lib/types";

const PURPOSES: Purpose[] = ["study", "meeting", "meal", "social"];

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: Partial<ReasonInput>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  if (!body.purpose || !PURPOSES.includes(body.purpose)) {
    return NextResponse.json({ error: "목적이 없어요." }, { status: 400 });
  }
  if (!body.timeLabel || !body.meetingTitle) {
    return NextResponse.json({ error: "정보가 모자라요." }, { status: 400 });
  }

  const comments = Array.isArray(body.comments)
    ? body.comments
        .filter((c): c is string => typeof c === "string" && c.trim().length > 0)
        .slice(0, 20)
        .map((c) => c.slice(0, 200))
    : [];

  const result = await generateReason({
    purpose: body.purpose,
    meetingTitle: String(body.meetingTitle).slice(0, 100),
    timeLabel: String(body.timeLabel).slice(0, 100),
    participantCount: Number(body.participantCount) || 0,
    attendable: Number(body.attendable) || 0,
    preferred: Number(body.preferred) || 0,
    durationLabel: String(body.durationLabel ?? "").slice(0, 40),
    requiredLabel: String(body.requiredLabel ?? "").slice(0, 40),
    comments,
  });

  if (!result) {
    return NextResponse.json({ reason: null, commentSummary: null });
  }
  return NextResponse.json(result);
}
