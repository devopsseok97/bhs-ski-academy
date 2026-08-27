"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import StatusPanel from "@/components/ui/StatusPanel";
import Toast from "@/components/ui/Toast";
import { requestJson } from "@/lib/http";

type Notice = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};
type FeedbackMessage = { tone: "success" | "error"; text: string } | null;

const TITLE_MAX = 60;
const BODY_MAX = 600;

function errorText(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "요청 처리에 실패했습니다. 잠시 후 다시 시도해주세요.";
}

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}

export default function NoticeManager() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [removeTargetId, setRemoveTargetId] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const [feedback, setFeedback] = useState<FeedbackMessage>(null);

  const requestReload = () => setReloadKey((key) => key + 1);

  useEffect(() => {
    const controller = new AbortController();
    requestJson<Notice[]>("/api/admin/notices", { signal: controller.signal })
      .then((next) => {
        if (controller.signal.aborted) return;
        setNotices(next);
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
    const active = notices.filter((n) => n.active);
    const inactive = notices.filter((n) => !n.active);
    return { active, inactive };
  }, [notices]);

  const removeTarget = notices.find((n) => n.id === removeTargetId) ?? null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle || !trimmedBody || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await requestJson("/api/admin/notices", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: trimmedTitle, body: trimmedBody, pinned }),
      });
      requestReload();
      setTitle("");
      setBody("");
      setPinned(false);
      setFeedback({ tone: "success", text: "공지를 게시했습니다." });
    } catch (error) {
      setFeedback({ tone: "error", text: errorText(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const patchNotice = async (
    id: string,
    data: { active?: boolean; pinned?: boolean },
    successText: string,
  ) => {
    setPendingId(id);
    try {
      await requestJson(`/api/admin/notices/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      requestReload();
      setFeedback({ tone: "success", text: successText });
    } catch (error) {
      setFeedback({ tone: "error", text: errorText(error) });
    } finally {
      setPendingId(null);
    }
  };

  const confirmRemove = async () => {
    if (!removeTargetId) return;
    setIsRemoving(true);
    try {
      await requestJson(`/api/admin/notices/${removeTargetId}`, { method: "DELETE" });
      requestReload();
      setRemoveTargetId(null);
      setFeedback({ tone: "success", text: "공지를 삭제했습니다." });
    } catch (error) {
      setFeedback({ tone: "error", text: errorText(error) });
    } finally {
      setIsRemoving(false);
    }
  };

  const renderList = (list: Notice[], variant: "active" | "inactive") => {
    if (list.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-border bg-surface/70 px-4 py-6 text-center text-sm text-slate">
          {variant === "active" ? "게시된 공지가 없습니다." : "숨긴 공지가 없습니다."}
        </div>
      );
    }
    return (
      <ul className="flex flex-col gap-3">
        {list.map((notice) => {
          const isPending = pendingId === notice.id;
          return (
            <li key={notice.id}>
              <article
                className={`flex overflow-hidden rounded-2xl border ${
                  variant === "active"
                    ? notice.pinned
                      ? "border-sunset/40 bg-surface"
                      : "border-border bg-surface"
                    : "border-border bg-surface/60"
                }`}
              >
                <div
                  aria-hidden="true"
                  className={`w-1.5 shrink-0 ${
                    variant === "inactive"
                      ? "bg-slate/30"
                      : notice.pinned
                        ? "bg-sunset"
                        : "bg-summit"
                  }`}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
                  <header className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span
                          className={`text-[11px] font-bold tracking-[0.14em] ${
                            variant === "inactive"
                              ? "text-slate"
                              : notice.pinned
                                ? "text-sunset"
                                : "text-summit"
                          }`}
                        >
                          {variant === "inactive"
                            ? "숨김"
                            : notice.pinned
                              ? "중요 공지"
                              : "공지"}
                        </span>
                        <span className="text-[11px] font-semibold text-slate">
                          {formatWhen(notice.createdAt)}
                        </span>
                      </div>
                      <h3
                        className={`mt-1 break-words text-lg font-black leading-tight tracking-[-0.02em] ${
                          variant === "inactive" ? "text-slate" : "text-alpine"
                        }`}
                      >
                        {notice.title}
                      </h3>
                    </div>
                  </header>
                  <p
                    className={`whitespace-pre-line break-words text-sm leading-6 ${
                      variant === "inactive" ? "text-slate" : "text-alpine/85"
                    }`}
                  >
                    {notice.body}
                  </p>
                  <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                    {variant === "active" ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            patchNotice(
                              notice.id,
                              { pinned: !notice.pinned },
                              notice.pinned
                                ? "중요 표시를 해제했습니다."
                                : "중요 공지로 표시했습니다.",
                            )
                          }
                          disabled={isPending}
                          className={`inline-flex min-h-[40px] items-center rounded-lg border px-3 py-1 text-sm font-bold ${
                            notice.pinned
                              ? "border-sunset/40 bg-sunset/10 text-sunset"
                              : "border-border bg-surface text-alpine hover:bg-ice"
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          {notice.pinned ? "중요 해제" : "중요 표시"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            patchNotice(notice.id, { active: false }, "공지를 숨겼습니다.")
                          }
                          disabled={isPending}
                          className="inline-flex min-h-[40px] items-center rounded-lg border border-border bg-surface px-3 py-1 text-sm font-bold text-alpine hover:bg-ice disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          숨기기
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          patchNotice(notice.id, { active: true }, "공지를 다시 게시했습니다.")
                        }
                        disabled={isPending}
                        className="inline-flex min-h-[40px] items-center rounded-lg border border-summit/40 bg-surface px-3 py-1 text-sm font-bold text-summit hover:bg-ice disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        다시 게시
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setRemoveTargetId(notice.id)}
                      disabled={isPending}
                      className="inline-flex min-h-[40px] items-center rounded-lg border border-danger/30 bg-surface px-3 py-1 text-sm font-bold text-danger hover:bg-danger/5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-4 border-b border-border pb-4">
        <h1 className="text-[32px] font-black leading-none tracking-[-0.03em] text-alpine sm:text-[36px]">
          공지
        </h1>
        <p className="hidden max-w-xs text-right text-sm leading-5 text-slate sm:block">
          학부모 반편성표 상단에 표시되는 공지사항을 관리합니다.
        </p>
      </header>

      <section
        aria-label="공지 요약"
        className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border"
      >
        <div className="bg-surface px-4 py-4 sm:px-5">
          <p className="text-[11px] font-bold tracking-[0.14em] text-summit">게시 중</p>
          <p className="mt-1 flex items-baseline gap-1 text-alpine">
            <span className="text-3xl font-black tabular-nums">{grouped.active.length}</span>
            <span className="text-sm font-bold text-slate">건</span>
          </p>
        </div>
        <div className="bg-surface px-4 py-4 sm:px-5">
          <p className="text-[11px] font-bold tracking-[0.14em] text-sunset">중요</p>
          <p className="mt-1 flex items-baseline gap-1 text-alpine">
            <span className="text-3xl font-black tabular-nums">
              {grouped.active.filter((n) => n.pinned).length}
            </span>
            <span className="text-sm font-bold text-slate">건</span>
          </p>
        </div>
      </section>

      <form
        onSubmit={submit}
        className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5"
      >
        <h2 className="text-lg font-bold text-alpine">공지 작성</h2>

        <label className="flex flex-col gap-2 text-sm font-semibold text-alpine">
          제목
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="예: 오늘 오전 수업 30분 지연"
            maxLength={TITLE_MAX}
            disabled={isSubmitting}
            className="min-h-[48px] rounded-xl border border-border bg-surface px-4 py-2 text-base text-alpine placeholder:text-slate disabled:bg-ice"
          />
          <span className="text-xs font-semibold text-slate">
            {title.length}/{TITLE_MAX}자
          </span>
        </label>

        <label className="flex flex-col gap-2 text-sm font-semibold text-alpine">
          내용
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="학부모께 전달할 내용을 입력하세요."
            maxLength={BODY_MAX}
            rows={5}
            disabled={isSubmitting}
            className="min-h-[120px] resize-y rounded-xl border border-border bg-surface px-4 py-3 text-[15px] leading-6 text-alpine placeholder:text-slate disabled:bg-ice"
          />
          <span className="text-xs font-semibold text-slate">
            {body.length}/{BODY_MAX}자
          </span>
        </label>

        <label className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(event) => setPinned(event.target.checked)}
            disabled={isSubmitting}
            className="h-5 w-5 accent-sunset"
          />
          <span>
            <span className="font-bold text-alpine">중요 공지로 게시</span>
            <span className="ml-2 text-xs text-slate">
              오렌지 라인·&ldquo;중요 공지&rdquo; 배지가 붙고, 목록 최상단에 고정됩니다.
            </span>
          </span>
        </label>

        <button
          type="submit"
          disabled={isSubmitting || title.trim().length === 0 || body.trim().length === 0}
          className="inline-flex min-h-[52px] items-center justify-center gap-2 self-end rounded-xl bg-alpine px-6 py-2 text-base font-black text-white hover:bg-summit disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <Spinner size="sm" label="게시 중" />}
          <span>{isSubmitting ? "게시 중" : "공지 게시"}</span>
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
          title="공지 목록을 불러오는 중입니다"
          description="잠시만 기다려주세요."
          action={<Spinner size="lg" label="공지 목록 불러오는 중" />}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <section aria-labelledby="active-notices" className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="active-notices" className="text-lg font-black tracking-[-0.02em] text-alpine">
                게시 중
              </h2>
              <span className="text-sm font-bold text-slate">{grouped.active.length}건</span>
            </div>
            {renderList(grouped.active, "active")}
          </section>

          <section aria-labelledby="hidden-notices" className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="hidden-notices" className="text-lg font-black tracking-[-0.02em] text-slate">
                숨긴 공지
              </h2>
              <span className="text-sm font-bold text-slate">{grouped.inactive.length}건</span>
            </div>
            {renderList(grouped.inactive, "inactive")}
          </section>
        </div>
      )}

      <Modal
        open={removeTarget !== null}
        title="공지 삭제 확인"
        onClose={() => {
          if (!isRemoving) setRemoveTargetId(null);
        }}
      >
        <div className="flex flex-col gap-4">
          <p className="text-[15px] leading-6 text-alpine">
            {removeTarget && (
              <>
                <span className="font-bold">{removeTarget.title}</span> 공지를 완전히 삭제할까요?
              </>
            )}
          </p>
          <p className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm leading-5 text-slate">
            삭제하면 되돌릴 수 없습니다. 일시적으로 내리고 싶다면 &ldquo;숨기기&rdquo;를
            사용하세요.
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
              <span>{isRemoving ? "삭제 중" : "공지 삭제"}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
