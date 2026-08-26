import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guard";
import { unassignStudent } from "@/lib/assignments";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  await unassignStudent(id);
  return NextResponse.json({ ok: true });
}
