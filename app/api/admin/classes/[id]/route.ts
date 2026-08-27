import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guard";
import { deleteClass } from "@/lib/assignments";
import { ClassNotFoundError, TeacherNotFoundError, updateClassTeacher } from "@/lib/classes";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  await deleteClass(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "요청 본문을 해석할 수 없습니다" }, { status: 400 });
  }

  const teacherId =
    typeof payload === "object" &&
    payload !== null &&
    "teacherId" in payload &&
    typeof (payload as { teacherId: unknown }).teacherId === "string"
      ? (payload as { teacherId: string }).teacherId.trim()
      : "";

  if (!teacherId) {
    return NextResponse.json({ error: "선생님을 선택해주세요" }, { status: 400 });
  }

  try {
    const updated = await updateClassTeacher(id, teacherId);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof ClassNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof TeacherNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
