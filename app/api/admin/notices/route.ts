import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";

const TITLE_MAX = 60;
const BODY_MAX = 600;

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const notices = await prisma.notice.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      body: true,
      pinned: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return NextResponse.json(notices);
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = (await req.json().catch(() => null)) as
    | { title?: unknown; body?: unknown; pinned?: unknown }
    | null;
  if (!body) return NextResponse.json({ error: "요청이 잘못되었습니다" }, { status: 400 });

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const noticeBody = typeof body.body === "string" ? body.body.trim() : "";
  const pinned = body.pinned === true;

  if (!title) return NextResponse.json({ error: "제목을 입력해주세요" }, { status: 400 });
  if (title.length > TITLE_MAX)
    return NextResponse.json(
      { error: `제목은 ${TITLE_MAX}자 이내로 입력해주세요` },
      { status: 400 },
    );
  if (!noticeBody) return NextResponse.json({ error: "내용을 입력해주세요" }, { status: 400 });
  if (noticeBody.length > BODY_MAX)
    return NextResponse.json(
      { error: `내용은 ${BODY_MAX}자 이내로 입력해주세요` },
      { status: 400 },
    );

  const notice = await prisma.notice.create({
    data: { title, body: noticeBody, pinned },
    select: {
      id: true,
      title: true,
      body: true,
      pinned: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return NextResponse.json(notice);
}
