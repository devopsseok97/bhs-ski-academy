import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const date = new URL(req.url).searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "날짜 형식이 잘못되었습니다" }, { status: 400 });
  }
  const classes = await prisma.class.findMany({
    where: { date },
    include: {
      teacher: { select: { name: true } },
      assignments: { include: { student: { select: { name: true } } } },
    },
  });
  const toCard = (c: (typeof classes)[number]) => ({
    id: c.id,
    teacherName: c.teacher.name,
    students: c.assignments.map((a) => a.student.name),
  });
  return NextResponse.json({
    date,
    am: classes.filter((c) => c.slot === "AM").map(toCard),
    pm: classes.filter((c) => c.slot === "PM").map(toCard),
  });
}
