import { describe, expect, it } from "vitest";
import { existsSync, statSync } from "node:fs";

describe("공식 로고", () => {
  it("공개 브랜드 자산으로 존재한다", () => {
    const path = "public/brand/bhs-ski-academy-logo.png";
    expect(existsSync(path)).toBe(true);
    expect(statSync(path).size).toBeGreaterThan(10_000);
  });
});
