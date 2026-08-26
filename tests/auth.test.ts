import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.ADMIN_PASSWORD = "test-password";
});

describe("auth", () => {
  it("올바른 비밀번호 통과", async () => {
    const { verifyPassword } = await import("@/lib/auth");
    expect(verifyPassword("test-password")).toBe(true);
    expect(verifyPassword("wrong")).toBe(false);
  });
  it("sessionToken은 결정적이며 비밀번호를 노출하지 않음", async () => {
    const { sessionToken } = await import("@/lib/auth");
    expect(sessionToken()).toBe(sessionToken());
    expect(sessionToken()).not.toContain("test-password");
    expect(sessionToken()).toMatch(/^[0-9a-f]{64}$/);
  });
});
