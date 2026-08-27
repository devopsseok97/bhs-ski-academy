import type { Class } from "@prisma/client";
import { prisma } from "./db";

export class ClassNotFoundError extends Error {
  constructor() {
    super("반을 찾을 수 없습니다");
    this.name = "ClassNotFoundError";
  }
}

export class TeacherNotFoundError extends Error {
  constructor() {
    super("선생님을 찾을 수 없습니다");
    this.name = "TeacherNotFoundError";
  }
}

export async function updateClassTeacher(classId: string, teacherId: string): Promise<Class> {
  const [klass, teacher] = await Promise.all([
    prisma.class.findUnique({ where: { id: classId } }),
    prisma.teacher.findUnique({ where: { id: teacherId } }),
  ]);

  if (!klass) throw new ClassNotFoundError();
  if (!teacher) throw new TeacherNotFoundError();

  return prisma.class.update({
    where: { id: classId },
    data: { teacherId },
  });
}
