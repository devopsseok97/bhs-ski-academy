import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const { name, memo } = await req.json();
  const data: { name?: string; memo?: string } = {};
  if (typeof name === "string" && name.trim()) data.name = name.trim();
  if (typeof memo === "string") data.memo = memo;
  const student = await prisma.student.update({ where: { id }, data });
  return NextResponse.json(student);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  await prisma.student.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
