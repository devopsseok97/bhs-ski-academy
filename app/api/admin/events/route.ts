import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
const VALID_TONES = ["competition", "notice"] as const;
type Tone = (typeof VALID_TONES)[number];

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const events = await prisma.calendarEvent.findMany({
    orderBy: { date: "asc" },
    select: { id: true, date: true, label: true, tone: true },
  });
  return NextResponse.json(events);
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = (await req.json().catch(() => null)) as
    | { date?: unknown; label?: unknown; tone?: unknown }
    | null;
  if (!body) return NextResponse.json({ error: "요청이 잘못되었습니다" }, { status: 400 });

  const date = typeof body.date === "string" ? body.date : "";
  const label = typeof body.label === "string" ? body.label.trim() : "";
  const tone: Tone =
    typeof body.tone === "string" && (VALID_TONES as readonly string[]).includes(body.tone)
      ? (body.tone as Tone)
      : "competition";

  if (!ISO_RE.test(date)) {
    return NextResponse.json({ error: "날짜 형식이 잘못되었습니다" }, { status: 400 });
  }
  if (!label) {
    return NextResponse.json({ error: "일정 이름을 입력해주세요" }, { status: 400 });
  }
  if (label.length > 40) {
    return NextResponse.json({ error: "일정 이름은 40자 이내로 입력해주세요" }, { status: 400 });
  }

  const event = await prisma.calendarEvent.create({
    data: { date, label, tone },
    select: { id: true, date: true, label: true, tone: true },
  });
  return NextResponse.json(event);
}
