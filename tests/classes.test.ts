import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { resetDb } from "./helpers/db";
import { updateClassTeacher, ClassNotFoundError, TeacherNotFoundError } from "@/lib/classes";

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

async function setup() {
  const first = await prisma.teacher.create({ data: { name: "김코치" } });
  const second = await prisma.teacher.create({ data: { name: "이코치" } });
  const klass = await prisma.class.create({
    data: { date: "2026-08-27", slot: "AM", teacherId: first.id },
  });
  return { first, second, klass };
}

describe("updateClassTeacher", () => {
  it("반의 담당 선생님을 변경한다", async () => {
    const { first, second, klass } = await setup();

    const updated = await updateClassTeacher(klass.id, second.id);

    expect(updated.teacherId).toBe(second.id);

    const persisted = await prisma.class.findUnique({ where: { id: klass.id } });
    expect(persisted?.teacherId).toBe(second.id);
    expect(first.id).not.toBe(second.id);
  });

  it("존재하지 않는 반이면 ClassNotFoundError를 던진다", async () => {
    const { second } = await setup();
    await expect(updateClassTeacher("does-not-exist", second.id)).rejects.toBeInstanceOf(
      ClassNotFoundError,
    );
  });

  it("존재하지 않는 선생님이면 TeacherNotFoundError를 던진다", async () => {
    const { klass } = await setup();
    await expect(updateClassTeacher(klass.id, "does-not-exist")).rejects.toBeInstanceOf(
      TeacherNotFoundError,
    );
  });
});
