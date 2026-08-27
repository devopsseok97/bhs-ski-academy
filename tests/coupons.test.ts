import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { resetDb } from "./helpers/db";
import { couponBalance, couponHistory, StudentNotFoundError } from "@/lib/coupons";

describe("couponBalance", () => {
  it("이력이 없으면 0", () => {
    expect(couponBalance([])).toBe(0);
  });
  it("충전/차감/복구 합산", () => {
    expect(
      couponBalance([{ delta: 10 }, { delta: -1 }, { delta: -1 }, { delta: 1 }])
    ).toBe(9);
  });
  it("음수 잔액도 그대로 반환 (0 쿠폰 배치 허용 정책)", () => {
    expect(couponBalance([{ delta: -1 }])).toBe(-1);
  });
});

describe("couponHistory", () => {
  beforeEach(resetDb);
  afterAll(() => prisma.$disconnect());

  it("쿠폰 이력을 최신순으로 반환한다", async () => {
    const student = await prisma.student.create({ data: { name: "이민준" } });
    await prisma.couponEvent.create({
      data: { studentId: student.id, delta: 10, reason: "최초 충전" },
    });
    await new Promise((resolve) => setTimeout(resolve, 5));
    await prisma.couponEvent.create({
      data: { studentId: student.id, delta: 5, reason: "최근 충전" },
    });

    const history = await couponHistory(student.id);

    expect(history.map((event) => event.reason)).toEqual(["최근 충전", "최초 충전"]);
    expect(history[0]).toMatchObject({ delta: 5, reason: "최근 충전" });
    expect(history[0].id).toEqual(expect.any(String));
    expect(history[0].createdAt).toBeInstanceOf(Date);
  });

  it("존재하지 않는 학생이면 StudentNotFoundError를 던진다", async () => {
    await expect(couponHistory("does-not-exist")).rejects.toBeInstanceOf(StudentNotFoundError);
  });
});
