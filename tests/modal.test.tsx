// @vitest-environment happy-dom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Modal from "@/components/ui/Modal";
import Toast from "@/components/ui/Toast";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

let container: HTMLDivElement;
let root: Root;

function renderModal(open: boolean, onClose = vi.fn()) {
  act(() => {
    root.render(
      <Modal open={open} title="쿠폰 충전" onClose={onClose}>
        <button type="button">첫 번째 동작</button>
        <button type="button">마지막 동작</button>
      </Modal>,
    );
  });

  return onClose;
}

beforeEach(() => {
  document.body.innerHTML = "";
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  document.body.innerHTML = "";
});

describe("Modal", () => {
  it("Tab과 Shift+Tab으로 대화상자 안에서만 초점을 순환한다", () => {
    renderModal(true);

    const closeButton = document.querySelector<HTMLButtonElement>("[aria-label='모달 닫기']")!;
    const lastAction = document.querySelectorAll<HTMLButtonElement>("button")[2]!;

    lastAction.focus();
    act(() => {
      lastAction.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    });
    expect(document.activeElement).toBe(closeButton);

    closeButton.focus();
    act(() => {
      closeButton.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true }),
      );
    });
    expect(document.activeElement).toBe(lastAction);
  });

  it("닫힐 때 열기 전의 초점을 복원한다", () => {
    const opener = document.createElement("button");
    document.body.prepend(opener);
    opener.focus();

    renderModal(true);
    renderModal(false);

    expect(document.activeElement).toBe(opener);
  });

  it("닫기 버튼에 44px 터치 대상을 제공한다", () => {
    renderModal(true);
    const closeButton = document.querySelector<HTMLButtonElement>("[aria-label='모달 닫기']")!;

    expect(closeButton.className).toContain("min-h-[44px]");
    expect(closeButton.className).toContain("min-w-[44px]");
  });
});

describe("Toast", () => {
  it("닫기 버튼에 44px 터치 대상을 제공한다", () => {
    act(() => {
      root.render(<Toast message="저장되었습니다" onDismiss={vi.fn()} />);
    });

    const closeButton = document.querySelector<HTMLButtonElement>("[aria-label='알림 닫기']")!;
    expect(closeButton.className).toContain("min-h-[44px]");
    expect(closeButton.className).toContain("min-w-[44px]");
  });
});
