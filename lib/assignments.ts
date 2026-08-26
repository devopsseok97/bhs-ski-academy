import { prisma } from "./db";

export async function assignStudent(classId: string, studentId: string) {
  return prisma.$transaction(async (tx) => {
    const assignment = await tx.classStudent.create({
      data: { classId, studentId },
    });
    await tx.couponEvent.create({
      data: { studentId, delta: -1, reason: "수업 배정" },
    });
    return assignment;
  });
}

export async function unassignStudent(assignmentId: string) {
  await prisma.$transaction(async (tx) => {
    const assignment = await tx.classStudent.delete({
      where: { id: assignmentId },
    });
    await tx.couponEvent.create({
      data: { studentId: assignment.studentId, delta: 1, reason: "배정 취소" },
    });
  });
}

export async function deleteClass(classId: string) {
  await prisma.$transaction(async (tx) => {
    const assignments = await tx.classStudent.findMany({ where: { classId } });
    if (assignments.length > 0) {
      await tx.couponEvent.createMany({
        data: assignments.map((a) => ({
          studentId: a.studentId,
          delta: 1,
          reason: "반 삭제",
        })),
      });
    }
    await tx.class.delete({ where: { id: classId } });
  });
}

export async function studentBalances(): Promise<Map<string, number>> {
  const groups = await prisma.couponEvent.groupBy({
    by: ["studentId"],
    _sum: { delta: true },
  });
  return new Map(groups.map((g) => [g.studentId, g._sum.delta ?? 0]));
}
