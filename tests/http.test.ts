import { afterEach, describe, expect, it, vi } from "vitest";
import { requestJson } from "@/lib/http";

describe("requestJson", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("서버 JSON 오류 메시지를 보존한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ error: "선생님을 선택해주세요" }), { status: 400 }),
        ),
    );

    await expect(requestJson("/test")).rejects.toThrow("선생님을 선택해주세요");
  });

  it("JSON이 아닌 오류 응답에는 기본 메시지를 사용한다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Bad gateway", { status: 502 })));

    await expect(requestJson("/test")).rejects.toThrow("요청 처리에 실패했습니다");
  });

  it("성공 응답 JSON을 반환한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "lesson-1" }), { status: 200 })),
    );

    await expect(requestJson<{ id: string }>("/test")).resolves.toEqual({ id: "lesson-1" });
  });
});
