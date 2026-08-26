import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guard";
import { assignStudent, studentBalances } from "@/lib/assignments";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const { studentId } = await req.json();
  if (typeof studentId !== "string") {
    return NextResponse.json({ error: "studentId가 필요합니다" }, { status: 400 });
  }
  const assignment = await assignStudent(id, studentId);
  const balances = await studentBalances();
  return NextResponse.json({
    assignmentId: assignment.id,
    balance: balances.get(studentId) ?? 0,
  });
}
