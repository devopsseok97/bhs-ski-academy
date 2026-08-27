"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ScheduleClass } from "@/components/schedule/ClassCard";
import ScheduleHeader from "@/components/schedule/ScheduleHeader";
import ScheduleSection from "@/components/schedule/ScheduleSection";
import Spinner from "@/components/ui/Spinner";
import StatusPanel from "@/components/ui/StatusPanel";
import { requestJson } from "@/lib/http";

type SchedulePayload = {
  date: string;
  am: ScheduleClass[];
  pm: ScheduleClass[];
};

type LoadedSchedule = {
  date: string;
  schedule: SchedulePayload;
};

type ScheduleViewState = {
  data: LoadedSchedule | null;
  selectedDate: string;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  updatedAt: Date | null;
};

const REFRESH_INTERVAL = 30_000;
const CONNECTION_ERROR =
  "반편성표를 불러오지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해주세요.";

function scheduleErrorMessage(error: unknown) {
  if (error instanceof Error && /[가-힣]/.test(error.message)) {
    return error.message;
  }

  return CONNECTION_ERROR;
}

function formatDateForStatus(date: string) {
  const [, month = 0, day = 0] = date.split("-").map(Number);
  return `${month}월 ${day}일`;
}

export default function ScheduleView({
  today,
  tomorrow,
}: {
  today: string;
  tomorrow: string;
}) {
  const [view, setView] = useState<ScheduleViewState>({
    data: null,
    selectedDate: today,
    isInitialLoading: true,
    isRefreshing: false,
    error: null,
    updatedAt: null,
  });
  const activeRequest = useRef<{ id: number; date: string; controller: AbortController } | null>(
    null,
  );
  const nextRequestId = useRef(0);

  const loadSchedule = useCallback(async (date: string) => {
    activeRequest.current?.controller.abort();

    const controller = new AbortController();
    const id = ++nextRequestId.current;
    activeRequest.current = { id, date, controller };

    setView((current) => {
      if (current.selectedDate !== date) return current;
      const hasCurrentData = current.data?.date === date;

      return {
        ...current,
        isInitialLoading: !hasCurrentData,
        isRefreshing: hasCurrentData,
        error: null,
      };
    });

    try {
      const schedule = await requestJson<SchedulePayload>(
        `/api/schedule?date=${encodeURIComponent(date)}`,
        { signal: controller.signal },
      );

      if (schedule.date !== date) {
        throw new Error("선택한 날짜의 반편성표를 받지 못했습니다.");
      }

      if (activeRequest.current?.id !== id) return;

      setView((current) => {
        if (current.selectedDate !== date) return current;

        return {
          ...current,
          data: { date, schedule },
          isInitialLoading: false,
          isRefreshing: false,
          error: null,
          updatedAt: new Date(),
        };
      });
    } catch (error) {
      if (controller.signal.aborted || activeRequest.current?.id !== id) return;

      setView((current) => {
        if (current.selectedDate !== date) return current;

        return {
          ...current,
          isInitialLoading: false,
          isRefreshing: false,
          error: scheduleErrorMessage(error),
        };
      });
    }
  }, []);

  useEffect(() => {
    void loadSchedule(view.selectedDate);
    const timer = window.setInterval(() => {
      void loadSchedule(view.selectedDate);
    }, REFRESH_INTERVAL);

    return () => {
      window.clearInterval(timer);
      if (activeRequest.current?.date === view.selectedDate) {
        activeRequest.current.controller.abort();
      }
    };
  }, [loadSchedule, view.selectedDate]);

  const selectDate = (date: string) => {
    if (date === view.selectedDate) return;

    activeRequest.current?.controller.abort();
    setView({
      data: null,
      selectedDate: date,
      isInitialLoading: true,
      isRefreshing: false,
      error: null,
      updatedAt: null,
    });
  };

  const displayedData = view.data?.date === view.selectedDate ? view.data.schedule : null;
  const isEmpty = displayedData !== null && displayedData.am.length + displayedData.pm.length === 0;
  const refresh = () => void loadSchedule(view.selectedDate);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,var(--color-ice)_0%,var(--color-surface-muted)_45%,var(--color-ice)_100%)]">
      <ScheduleHeader
        today={today}
        tomorrow={tomorrow}
        selectedDate={view.selectedDate}
        updatedAt={view.updatedAt}
        isLoading={view.isInitialLoading || view.isRefreshing}
        onSelectDate={selectDate}
        onRefresh={refresh}
      />

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        {view.error && displayedData && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-2xl border border-danger/25 bg-white px-4 py-3 text-sm leading-6 text-danger shadow-sm"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="mt-0.5 h-5 w-5 shrink-0"
            >
              <path
                d="M12 8v5m0 3.5v.01M10.3 3.8 2.4 17.5A2 2 0 0 0 4.1 20h15.8a2 2 0 0 0 1.7-2.5L13.7 3.8a2 2 0 0 0-3.4 0Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            <p>{view.error}</p>
          </div>
        )}

        {view.isRefreshing && displayedData && (
          <div
            role="status"
            aria-live="polite"
            className="mb-5 flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-sky/25 bg-white/90 px-4 py-2 text-sm font-semibold text-summit shadow-sm"
          >
            <Spinner size="sm" label="반편성표 갱신 중" />
            <span>최신 반편성표로 갱신 중입니다.</span>
          </div>
        )}

        {view.isInitialLoading && !displayedData && (
          <StatusPanel
            title={`${formatDateForStatus(view.selectedDate)} 반편성표를 불러오는 중입니다`}
            description="잠시만 기다려주세요."
            action={<Spinner size="lg" label="반편성표 불러오는 중" />}
          />
        )}

        {!view.isInitialLoading && view.error && !displayedData && (
          <StatusPanel
            tone="error"
            title="반편성표를 불러오지 못했습니다"
            description={view.error}
            action={
              <button
                type="button"
                onClick={refresh}
                className="min-h-[44px] rounded-xl bg-danger px-5 py-2 text-sm font-bold text-white transition hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                다시 시도
              </button>
            }
          />
        )}

        {!view.isInitialLoading && isEmpty && (
          <StatusPanel
            title="아직 반편성 전입니다"
            description={`${formatDateForStatus(view.selectedDate)} 수업 반편성이 완료되면 이곳에 안내해드립니다.`}
          />
        )}

        {displayedData && !isEmpty && (
          <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-8">
            <ScheduleSection title="오전" slot="AM" classes={displayedData.am} />
            <ScheduleSection title="오후" slot="PM" classes={displayedData.pm} />
          </div>
        )}
      </div>
    </div>
  );
}
