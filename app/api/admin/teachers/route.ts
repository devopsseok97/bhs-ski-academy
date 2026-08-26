import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const teachers = await prisma.teacher.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return NextResponse.json(teachers);
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { name } = await req.json();
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "이름을 입력해주세요" }, { status: 400 });
  }
  const teacher = await prisma.teacher.create({ data: { name: name.trim() } });
  return NextResponse.json(teacher);
}
