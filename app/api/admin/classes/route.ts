import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { studentBalances } from "@/lib/assignments";

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const date = new URL(req.url).searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date가 필요합니다" }, { status: 400 });
  const [classes, balances] = await Promise.all([
    prisma.class.findMany({
      where: { date },
      orderBy: [{ slot: "asc" }],
      include: {
        teacher: { select: { id: true, name: true } },
        assignments: { include: { student: { select: { id: true, name: true } } } },
      },
    }),
    studentBalances(),
  ]);
  return NextResponse.json(
    classes.map((c) => ({
      id: c.id,
      slot: c.slot,
      teacher: c.teacher,
      assignments: c.assignments.map((a) => ({
        id: a.id,
        student: a.student,
        balance: balances.get(a.student.id) ?? 0,
      })),
    }))
  );
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { date, slot, teacherId } = await req.json();
  if (
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    (slot !== "AM" && slot !== "PM") ||
    typeof teacherId !== "string"
  ) {
    return NextResponse.json({ error: "입력값을 확인해주세요" }, { status: 400 });
  }
  const klass = await prisma.class.create({ data: { date, slot, teacherId } });
  return NextResponse.json(klass);
}
