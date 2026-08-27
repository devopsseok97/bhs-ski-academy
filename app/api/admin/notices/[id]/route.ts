import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as
    | { active?: unknown; pinned?: unknown }
    | null;
  if (!body) return NextResponse.json({ error: "요청이 잘못되었습니다" }, { status: 400 });

  const data: { active?: boolean; pinned?: boolean } = {};
  if (typeof body.active === "boolean") data.active = body.active;
  if (typeof body.pinned === "boolean") data.pinned = body.pinned;
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "변경할 항목이 없습니다" }, { status: 400 });
  }

  const notice = await prisma.notice.update({
    where: { id },
    data,
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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  await prisma.notice.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
