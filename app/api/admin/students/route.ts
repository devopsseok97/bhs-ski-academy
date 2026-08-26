import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { studentBalances } from "@/lib/assignments";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const [students, balances] = await Promise.all([
    prisma.student.findMany({ orderBy: { name: "asc" } }),
    studentBalances(),
  ]);
  return NextResponse.json(
    students.map((s) => ({
      id: s.id,
      name: s.name,
      memo: s.memo,
      balance: balances.get(s.id) ?? 0,
    }))
  );
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { name, memo } = await req.json();
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "이름을 입력해주세요" }, { status: 400 });
  }
  const student = await prisma.student.create({
    data: { name: name.trim(), memo: typeof memo === "string" ? memo : "" },
  });
  return NextResponse.json(student);
}
