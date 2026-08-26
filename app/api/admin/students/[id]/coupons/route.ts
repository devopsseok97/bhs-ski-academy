import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { couponBalance } from "@/lib/coupons";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const { amount } = await req.json();
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount === 0) {
    return NextResponse.json({ error: "충전 횟수를 확인해주세요" }, { status: 400 });
  }
  await prisma.couponEvent.create({
    data: { studentId: id, delta: amount, reason: amount > 0 ? "쿠폰 충전" : "관리자 조정" },
  });
  const events = await prisma.couponEvent.findMany({ where: { studentId: id } });
  return NextResponse.json({ balance: couponBalance(events) });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const events = await prisma.couponEvent.findMany({
    where: { studentId: id },
    orderBy: { createdAt: "desc" },
    select: { delta: true, reason: true, createdAt: true },
  });
  return NextResponse.json(events);
}
