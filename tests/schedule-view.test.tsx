// @vitest-environment happy-dom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ScheduleView from "@/components/ScheduleView";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
}

function scheduleResponse(
  date: string,
  {
    am = [],
    pm = [],
  }: {
    am?: Array<{ id: string; teacherName: string; students: string[] }>;
    pm?: Array<{ id: string; teacherName: string; students: string[] }>;
  } = {},
) {
  return new Response(JSON.stringify({ date, am, pm }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function stubScheduleFetch(
  scheduleFetch: (
    input: string | URL | Request,
    init?: RequestInit,
  ) => Promise<Response>,
  notices: Array<{
    id: string;
    title: string;
    body: string;
    pinned: boolean;
    createdAt: string;
  }> = [],
) {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/api/events") || url.endsWith("/api/notices")) {
        return Promise.resolve(
          new Response(JSON.stringify(url.endsWith("/api/notices") ? notices : []), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      return scheduleFetch(input, init);
    }),
  );
}

let container: HTMLDivElement;
let root: Root;

async function renderSchedule() {
  await act(async () => {
    root.render(<ScheduleView today="2026-08-26" tomorrow="2026-08-27" />);
  });
}

function buttonNamed(name: string) {
  const button = Array.from(container.querySelectorAll("button")).find((candidate) =>
    candidate.textContent?.includes(name),
  );

  if (!button) throw new Error(`${name} 버튼을 찾지 못했습니다`);
  return button;
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
  vi.restoreAllMocks();
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("학부모 반편성표", () => {
  it("공지를 달력과 수업 현황 사이의 상단 헤더에 표시한다", async () => {
    stubScheduleFetch(vi.fn().mockResolvedValue(scheduleResponse("2026-08-26")), [
      {
        id: "notice-1",
        title: "오늘 공지",
        body: "수업 시간을 확인해주세요.",
        pinned: true,
        createdAt: "2026-08-26T00:00:00.000Z",
      },
    ]);

    await renderSchedule();

    const header = container.querySelector("header");
    expect(header?.querySelector("[aria-label='공지사항']")?.textContent).toContain("오늘 공지");
  });

  it("최초 요청 중에는 날짜가 명시된 로딩 상태를 알린다", async () => {
    const initial = deferred<Response>();
    stubScheduleFetch(vi.fn(() => initial.promise));

    await renderSchedule();

    const loading = container.querySelector("[aria-live='polite']");
    expect(loading?.textContent).toContain("8월 26일");
    expect(loading?.textContent).toContain("불러오는 중");

    await act(async () => {
      initial.resolve(scheduleResponse("2026-08-26"));
      await initial.promise;
    });
  });

  it("날짜를 바꾸면 이전 날짜 명단을 즉시 숨기고 선택 상태를 표시한다", async () => {
    const tomorrow = deferred<Response>();
    stubScheduleFetch(
      vi
        .fn()
        .mockResolvedValueOnce(
          scheduleResponse("2026-08-26", {
            am: [{ id: "today", teacherName: "김설산", students: ["오늘아이"] }],
          }),
        )
        .mockImplementationOnce(() => tomorrow.promise),
    );

    await renderSchedule();
    expect(container.textContent).toContain("오늘아이");

    const tomorrowButton = buttonNamed("내일");
    await act(async () => {
      tomorrowButton.click();
    });

    expect(tomorrowButton.getAttribute("aria-pressed")).toBe("true");
    expect(buttonNamed("오늘").getAttribute("aria-pressed")).toBe("false");
    expect(container.textContent).not.toContain("오늘아이");
    expect(container.textContent).toContain("8월 27일");
    expect(tomorrowButton.className).toContain("min-h-[44px]");

    await act(async () => {
      tomorrow.resolve(
        scheduleResponse("2026-08-27", {
          pm: [{ id: "tomorrow", teacherName: "박스키", students: ["내일아이"] }],
        }),
      );
      await tomorrow.promise;
    });

    expect(container.textContent).toContain("내일아이");
  });

  it("수동 갱신 중에는 현재 명단을 유지하고 갱신 상태를 알린다", async () => {
    const refresh = deferred<Response>();
    stubScheduleFetch(
      vi
        .fn()
        .mockResolvedValueOnce(
          scheduleResponse("2026-08-26", {
            am: [{ id: "class", teacherName: "김설산", students: ["배현재"] }],
          }),
        )
        .mockImplementationOnce(() => refresh.promise),
    );

    await renderSchedule();
    const refreshButton = container.querySelector<HTMLButtonElement>(
      "[aria-label='반편성표 새로고침']",
    )!;

    await act(async () => {
      refreshButton.click();
    });

    expect(container.textContent).toContain("배현재");
    expect(container.textContent).toContain("최신 반편성표로 갱신 중");
    expect(refreshButton.disabled).toBe(true);
    expect(refreshButton.className).toContain("min-h-[44px]");

    await act(async () => {
      refresh.resolve(
        scheduleResponse("2026-08-26", {
          am: [{ id: "class", teacherName: "김설산", students: ["배현재", "이신규"] }],
        }),
      );
      await refresh.promise;
    });

    expect(container.textContent).toContain("이신규");
    expect(container.textContent).toMatch(/갱신 \d{2}:\d{2}/);
  });

  it("갱신이 실패해도 기존 명단과 한국어 경고를 함께 표시한다", async () => {
    stubScheduleFetch(
      vi
        .fn()
        .mockResolvedValueOnce(
          scheduleResponse("2026-08-26", {
            pm: [{ id: "class", teacherName: "박스키", students: ["유지되는아이"] }],
          }),
        )
        .mockRejectedValueOnce(new TypeError("Failed to fetch")),
    );

    await renderSchedule();
    await act(async () => {
      container.querySelector<HTMLButtonElement>("[aria-label='반편성표 새로고침']")!.click();
    });

    expect(container.textContent).toContain("유지되는아이");
    const warning = container.querySelector("[role='alert']");
    expect(warning?.textContent).toContain("인터넷 연결을 확인");
    expect(warning?.textContent).not.toContain("Failed to fetch");
  });

  it("첫 요청 실패와 빈 반편성을 서로 다른 안내로 표시한다", async () => {
    stubScheduleFetch(vi.fn().mockRejectedValueOnce(new TypeError("Failed to fetch")));

    await renderSchedule();
    expect(container.querySelector("[role='alert']")?.textContent).toContain(
      "반편성표를 불러오지 못했습니다",
    );
    expect(buttonNamed("다시 시도")).toBeTruthy();

    act(() => {
      root.unmount();
    });
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    stubScheduleFetch(vi.fn().mockResolvedValueOnce(scheduleResponse("2026-08-26")));

    await renderSchedule();
    expect(container.textContent).toContain("아직 반편성 전입니다");
    expect(container.querySelector("[role='alert']")).toBeNull();
  });

  it("빈 반편성을 갱신하다 실패해도 빈 상태 안내를 유지한다", async () => {
    stubScheduleFetch(
      vi
        .fn()
        .mockResolvedValueOnce(scheduleResponse("2026-08-26"))
        .mockRejectedValueOnce(new TypeError("Failed to fetch")),
    );

    await renderSchedule();
    expect(container.textContent).toContain("아직 반편성 전입니다");

    await act(async () => {
      container.querySelector<HTMLButtonElement>("[aria-label='반편성표 새로고침']")!.click();
    });

    expect(container.querySelector("[role='alert']")?.textContent).toContain(
      "인터넷 연결을 확인",
    );
    expect(container.textContent).toContain("아직 반편성 전입니다");
  });

  it("학생 이름을 모바일에서도 17px 이상으로 표시한다", async () => {
    stubScheduleFetch(
      vi.fn().mockResolvedValueOnce(
        scheduleResponse("2026-08-26", {
          am: [{ id: "class", teacherName: "김설산", students: ["한설아"] }],
        }),
      ),
    );

    await renderSchedule();

    const student = Array.from(container.querySelectorAll("li")).find(
      (item) => item.textContent === "한설아",
    );
    const fontSize = student?.className.match(/text-\[(\d+)px\]/)?.[1];
    expect(Number(fontSize)).toBeGreaterThanOrEqual(17);
  });
});
