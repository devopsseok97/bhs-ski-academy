"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import StatusPanel from "@/components/ui/StatusPanel";
import Toast from "@/components/ui/Toast";
import { seoulDate } from "@/lib/dates";
import { requestJson } from "@/lib/http";

type Tone = "competition" | "notice";
type CalendarEvent = {
  id: string;
  date: string;
  label: string;
  tone: Tone;
};
type FeedbackMessage = { tone: "success" | "error"; text: string } | null;

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const TONES: Array<{ id: Tone; label: string; hint: string }> = [
  { id: "competition", label: "시합", hint: "대회·시합" },
  { id: "notice", label: "공지", hint: "휴업·안내" },
];

function errorText(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "요청 처리에 실패했습니다. 잠시 후 다시 시도해주세요.";
}

function formatEventDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${year}년 ${month}월 ${day}일 (${weekday})`;
}

function isPastDate(iso: string) {
  return iso < seoulDate();
}

export default function EventManager() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [date, setDate] = useState(seoulDate());
  const [label, setLabel] = useState("");
  const [tone, setTone] = useState<Tone>("competition");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [removeTargetId, setRemoveTargetId] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const [feedback, setFeedback] = useState<FeedbackMessage>(null);

  const requestReload = () => setReloadKey((key) => key + 1);

  useEffect(() => {
    const controller = new AbortController();
    requestJson<CalendarEvent[]>("/api/admin/events", { signal: controller.signal })
      .then((next) => {
        if (controller.signal.aborted) return;
        setEvents(next);
        setLoaded(true);
        setLoadError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setLoadError(errorText(cause));
        setLoaded(true);
      });
    return () => controller.abort();
  }, [reloadKey]);

  const grouped = useMemo(() => {
    const today = seoulDate();
    const upcoming = events.filter((e) => e.date >= today);
    const past = events.filter((e) => e.date < today).reverse();
    return { upcoming, past };
  }, [events]);

  const removeTarget = events.find((e) => e.id === removeTargetId) ?? null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = label.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await requestJson("/api/admin/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ date, label: trimmed, tone }),
      });
      requestReload();
      setLabel("");
      setFeedback({
        tone: "success",
        text: `${formatEventDate(date)} 일정을 추가했습니다.`,
      });
    } catch (error) {
      setFeedback({ tone: "error", text: errorText(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmRemove = async () => {
    if (!removeTargetId) return;
    setIsRemoving(true);
    try {
      await requestJson(`/api/admin/events/${removeTargetId}`, { method: "DELETE" });
      requestReload();
      setRemoveTargetId(null);
      setFeedback({ tone: "success", text: "일정을 삭제했습니다." });
    } catch (error) {
      setFeedback({ tone: "error", text: errorText(error) });
    } finally {
      setIsRemoving(false);
    }
  };

  const renderList = (list: CalendarEvent[], variant: "upcoming" | "past") => {
    if (list.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-border bg-surface/70 px-4 py-6 text-center text-sm text-slate">
          {variant === "upcoming" ? "예정된 일정이 없습니다." : "지난 일정이 없습니다."}
        </div>
      );
    }
    return (
      <ul className="flex flex-col gap-2">
        {list.map((event) => {
          const isPast = isPastDate(event.date);
          const isCompetition = event.tone === "competition";
          return (
            <li
              key={event.id}
              className={`flex items-stretch overflow-hidden rounded-2xl border ${
                isPast ? "border-border bg-surface/70" : "border-border bg-surface"
              }`}
            >
              <span
                aria-hidden="true"
                className={`w-1.5 shrink-0 ${
                  isPast
                    ? "bg-slate/30"
                    : isCompetition
                      ? "bg-sunset"
                      : "bg-sky"
                }`}
              />
              <div className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p
                    className={`text-[11px] font-bold tracking-[0.14em] ${
                      isPast ? "text-slate/70" : isCompetition ? "text-sunset" : "text-summit"
                    }`}
                  >
                    {isCompetition ? "시합" : "공지"}
                  </p>
                  <p
                    className={`mt-0.5 truncate text-[18px] font-black leading-6 tracking-[-0.015em] ${
                      isPast ? "text-slate" : "text-alpine"
                    }`}
                  >
                    {event.label}
                  </p>
                  <p className={`mt-0.5 text-xs font-bold ${isPast ? "text-slate/70" : "text-slate"}`}>
                    {formatEventDate(event.date)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRemoveTargetId(event.id)}
                  className="inline-flex min-h-[40px] shrink-0 items-center rounded-lg border border-danger/30 bg-surface px-3 py-1 text-sm font-bold text-danger hover:bg-danger/5"
                >
                  삭제
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  const upcomingCompetition = grouped.upcoming.filter((e) => e.tone === "competition").length;
  const upcomingNotice = grouped.upcoming.filter((e) => e.tone === "notice").length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-4 border-b border-border pb-4">
        <h1 className="text-[32px] font-black leading-none tracking-[-0.03em] text-alpine sm:text-[36px]">
          일정
        </h1>
        <p className="hidden max-w-xs text-right text-sm leading-5 text-slate sm:block">
          시합·공지 일정을 넣으면 학부모용 반편성표 달력에 표시됩니다.
        </p>
      </header>

      <section
        aria-label="일정 요약"
        className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border"
      >
        <div className="bg-surface px-4 py-4 sm:px-5">
          <p className="text-[11px] font-bold tracking-[0.14em] text-sunset">시합 예정</p>
          <p className="mt-1 flex items-baseline gap-1 text-alpine">
            <span className="text-3xl font-black tabular-nums">{upcomingCompetition}</span>
            <span className="text-sm font-bold text-slate">건</span>
          </p>
        </div>
        <div className="bg-surface px-4 py-4 sm:px-5">
          <p className="text-[11px] font-bold tracking-[0.14em] text-summit">공지 예정</p>
          <p className="mt-1 flex items-baseline gap-1 text-alpine">
            <span className="text-3xl font-black tabular-nums">{upcomingNotice}</span>
            <span className="text-sm font-bold text-slate">건</span>
          </p>
        </div>
      </section>

      <form
        onSubmit={submit}
        className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5"
      >
        <h2 className="text-lg font-bold text-alpine">일정 추가</h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-semibold text-alpine">
            날짜
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              disabled={isSubmitting}
              className="min-h-[48px] rounded-xl border border-border bg-surface px-4 py-2 text-base text-alpine disabled:bg-ice"
            />
          </label>

          <fieldset className="flex flex-col gap-2 text-sm font-semibold text-alpine">
            <legend>종류</legend>
            <div className="flex gap-2">
              {TONES.map((option) => {
                const active = option.id === tone;
                const isComp = option.id === "competition";
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setTone(option.id)}
                    aria-pressed={active}
                    className={`flex flex-1 min-h-[48px] flex-col items-center justify-center rounded-xl border px-3 py-2 text-sm font-bold transition-colors ${
                      active
                        ? isComp
                          ? "border-sunset bg-sunset/10 text-sunset"
                          : "border-summit bg-summit/10 text-summit"
                        : "border-border bg-surface text-slate hover:bg-ice"
                    }`}
                  >
                    <span className="text-[15px] font-black">{option.label}</span>
                    <span className={`text-[11px] font-bold ${active ? "opacity-80" : "text-slate"}`}>
                      {option.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        <label className="flex flex-col gap-2 text-sm font-semibold text-alpine">
          일정 이름
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="예: 지산 리조트 대회"
            maxLength={40}
            disabled={isSubmitting}
            className="min-h-[48px] rounded-xl border border-border bg-surface px-4 py-2 text-base text-alpine placeholder:text-slate disabled:bg-ice"
          />
          <span className="text-xs font-semibold text-slate">최대 40자, 학부모 달력에 표시됩니다.</span>
        </label>

        <button
          type="submit"
          disabled={isSubmitting || label.trim().length === 0}
          className="inline-flex min-h-[52px] items-center justify-center gap-2 self-end rounded-xl bg-alpine px-6 py-2 text-base font-black text-white hover:bg-summit disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <Spinner size="sm" label="추가 중" />}
          <span>{isSubmitting ? "추가 중" : "일정 추가"}</span>
        </button>
      </form>

      {feedback && (
        <Toast tone={feedback.tone} message={feedback.text} onDismiss={() => setFeedback(null)} />
      )}

      {loadError && loaded && (
        <Toast tone="error" message={loadError} onDismiss={() => setLoadError(null)} />
      )}

      {!loaded ? (
        <StatusPanel
          title="일정 목록을 불러오는 중입니다"
          description="잠시만 기다려주세요."
          action={<Spinner size="lg" label="일정 목록 불러오는 중" />}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <section aria-labelledby="upcoming-events" className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="upcoming-events" className="text-lg font-black tracking-[-0.02em] text-alpine">
                예정된 일정
              </h2>
              <span className="text-sm font-bold text-slate">{grouped.upcoming.length}건</span>
            </div>
            {renderList(grouped.upcoming, "upcoming")}
          </section>

          <section aria-labelledby="past-events" className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="past-events" className="text-lg font-black tracking-[-0.02em] text-slate">
                지난 일정
              </h2>
              <span className="text-sm font-bold text-slate">{grouped.past.length}건</span>
            </div>
            {renderList(grouped.past, "past")}
          </section>
        </div>
      )}

      <Modal
        open={removeTarget !== null}
        title="일정 삭제 확인"
        onClose={() => {
          if (!isRemoving) setRemoveTargetId(null);
        }}
      >
        <div className="flex flex-col gap-4">
          <p className="text-[15px] leading-6 text-alpine">
            {removeTarget && (
              <>
                <span className="font-bold">
                  {formatEventDate(removeTarget.date)} · {removeTarget.label}
                </span>{" "}
                일정을 삭제할까요?
              </>
            )}
          </p>
          <p className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm leading-5 text-slate">
            학부모 반편성표 달력에서도 즉시 사라집니다.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setRemoveTargetId(null)}
              disabled={isRemoving}
              className="inline-flex min-h-[48px] items-center rounded-xl border border-border bg-surface px-4 py-2 text-sm font-bold text-alpine hover:bg-ice disabled:cursor-not-allowed disabled:opacity-60"
            >
              취소
            </button>
            <button
              type="button"
              onClick={confirmRemove}
              disabled={isRemoving}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-danger px-5 py-2 text-sm font-bold text-white hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRemoving && <Spinner size="sm" label="삭제 중" />}
              <span>{isRemoving ? "삭제 중" : "일정 삭제"}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
