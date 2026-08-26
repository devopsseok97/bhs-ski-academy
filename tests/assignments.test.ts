import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { resetDb } from "./helpers/db";
import {
  assignStudent,
  unassignStudent,
  deleteClass,
  studentBalances,
} from "@/lib/assignments";

async function setup() {
  const teacher = await prisma.teacher.create({ data: { name: "김코치" } });
  const student = await prisma.student.create({ data: { name: "이민준" } });
  await prisma.couponEvent.create({
    data: { studentId: student.id, delta: 10, reason: "쿠폰 충전" },
  });
  const klass = await prisma.class.create({
    data: { date: "2026-12-29", slot: "AM", teacherId: teacher.id },
  });
  return { teacher, student, klass };
}

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("assignStudent", () => {
  it("배정 시 쿠폰 1회 차감", async () => {
    const { student, klass } = await setup();
    await assignStudent(klass.id, student.id);
    expect((await studentBalances()).get(student.id)).toBe(9);
    expect(await prisma.classStudent.count({ where: { classId: klass.id } })).toBe(1);
  });
  it("같은 아이 중복 배정 허용, 각각 차감", async () => {
    const { student, klass } = await setup();
    await assignStudent(klass.id, student.id);
    await assignStudent(klass.id, student.id);
    expect((await studentBalances()).get(student.id)).toBe(8);
  });
  it("잔액 0이어도 배정 가능 (음수 허용)", async () => {
    const { student, klass } = await setup();
    await prisma.couponEvent.create({
      data: { studentId: student.id, delta: -10, reason: "테스트 소진" },
    });
    await assignStudent(klass.id, student.id);
    expect((await studentBalances()).get(student.id)).toBe(-1);
  });
});

describe("unassignStudent", () => {
  it("배정 취소 시 쿠폰 복구", async () => {
    const { student, klass } = await setup();
    const a = await assignStudent(klass.id, student.id);
    await unassignStudent(a.id);
    expect((await studentBalances()).get(student.id)).toBe(10);
    expect(await prisma.classStudent.count()).toBe(0);
  });
});

describe("deleteClass", () => {
  it("반 삭제 시 배정된 전원 쿠폰 복구", async () => {
    const { student, klass } = await setup();
    const other = await prisma.student.create({ data: { name: "박서연" } });
    await prisma.couponEvent.create({
      data: { studentId: other.id, delta: 5, reason: "쿠폰 충전" },
    });
    await assignStudent(klass.id, student.id);
    await assignStudent(klass.id, other.id);
    await deleteClass(klass.id);
    const balances = await studentBalances();
    expect(balances.get(student.id)).toBe(10);
    expect(balances.get(other.id)).toBe(5);
    expect(await prisma.class.count()).toBe(0);
    expect(await prisma.classStudent.count()).toBe(0);
  });
});
