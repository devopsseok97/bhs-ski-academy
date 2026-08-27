// @vitest-environment happy-dom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminDashboard from "@/components/admin/AdminDashboard";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  document.body.innerHTML = "";
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  vi.stubGlobal(
    "fetch",
    vi.fn((input: string | URL | Request) => {
      const url = String(input);
      const payload = url.includes("/api/admin/notices") ? [] : [];
      return Promise.resolve(
        new Response(JSON.stringify(payload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }),
  );
});

afterEach(() => {
  act(() => root.unmount());
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("admin notice management", () => {
  it("opens the notice publishing form from the admin navigation", async () => {
    await act(async () => {
      root.render(<AdminDashboard />);
    });

    const noticeButtons = Array.from(container.querySelectorAll("button")).filter(
      (button) => button.textContent?.trim() === "공지",
    );
    expect(noticeButtons.length).toBeGreaterThan(0);

    await act(async () => {
      noticeButtons[0].click();
    });

    expect(container.querySelector("form")?.textContent).toContain("공지 작성");
    expect(container.querySelector("input[placeholder*='오늘 오전 수업']")).not.toBeNull();
    expect(container.querySelector("textarea[placeholder*='학부모']")).not.toBeNull();
  });
});
