import { prisma } from "./db";

export function couponBalance(events: { delta: number }[]): number {
  return events.reduce((sum, e) => sum + e.delta, 0);
}

export class StudentNotFoundError extends Error {
  constructor() {
    super("학생을 찾을 수 없습니다");
    this.name = "StudentNotFoundError";
  }
}

export type CouponHistoryEntry = {
  id: string;
  delta: number;
  reason: string;
  createdAt: Date;
};

export async function couponHistory(studentId: string): Promise<CouponHistoryEntry[]> {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new StudentNotFoundError();

  return prisma.couponEvent.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    select: { id: true, delta: true, reason: true, createdAt: true },
  });
}
