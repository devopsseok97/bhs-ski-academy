import { describe, it, expect } from "vitest";
import { couponBalance } from "@/lib/coupons";

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
