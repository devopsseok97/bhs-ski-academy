import { describe, it, expect } from "vitest";
import { seoulDate } from "@/lib/dates";

describe("seoulDate", () => {
  it("YYYY-MM-DD 형식", () => {
    expect(seoulDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it("내일은 오늘보다 뒤", () => {
    expect(seoulDate(1) > seoulDate()).toBe(true);
  });
});
