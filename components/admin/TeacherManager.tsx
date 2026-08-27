"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import StatusPanel from "@/components/ui/StatusPanel";
import Toast from "@/components/ui/Toast";
import { requestJson } from "@/lib/http";

type Teacher = { id: string; name: string };
type FeedbackMessage = { tone: "success" | "error"; text: string } | null;

function errorText(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "요청 처리에 실패했습니다. 잠시 후 다시 시도해주세요.";
}

export default function TeacherManager() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [removeTargetId, setRemoveTargetId] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const [feedback, setFeedback] = useState<FeedbackMessage>(null);

  const requestReload = () => setReloadKey((key) => key + 1);

  useEffect(() => {
    const controller = new AbortController();
    requestJson<Teacher[]>("/api/admin/teachers", { signal: controller.signal })
      .then((next) => {
        if (controller.signal.aborted) return;
        setTeachers(next);
        setLoaded(true);
        setLoadError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setLoaded(true);
        setLoadError(errorText(cause));
      });
    return () => controller.abort();
  }, [reloadKey]);

  const removeTarget = teachers.find((t) => t.id === removeTargetId) ?? null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await requestJson("/api/admin/teachers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      requestReload();
      setName("");
      setFeedback({ tone: "success", text: `${trimmed} 선생님을 등록했습니다.` });
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
      await requestJson(`/api/admin/teachers/${removeTargetId}`, { method: "DELETE" });
      requestReload();
      setRemoveTargetId(null);
      setFeedback({ tone: "success", text: "선생님을 목록에서 제외했습니다." });
    } catch (error) {
      setFeedback({ tone: "error", text: errorText(error) });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-alpine">선생님</h1>
        <p className="text-sm text-slate">
          강습을 진행할 선생님을 등록하고 관리하세요. 제외해도 기존 반편성 기록은 그대로 남습니다.
        </p>
      </header>

      <form
        onSubmit={submit}
        className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5"
      >
        <h2 className="text-lg font-bold text-alpine">선생님 등록</h2>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="flex flex-col gap-1 text-sm font-semibold text-alpine">
            이름
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="선생님 이름"
              disabled={isSubmitting}
              className="min-h-[48px] rounded-xl border border-border bg-surface px-4 py-2 text-base text-alpine placeholder:text-slate disabled:bg-ice"
            />
          </label>
          <button
            type="submit"
            disabled={isSubmitting || name.trim().length === 0}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-alpine px-5 py-2 text-sm font-bold text-white hover:bg-summit disabled:cursor-not-allowed disabled:opacity-60 sm:self-end"
          >
            {isSubmitting && <Spinner size="sm" label="등록 중" />}
            <span>{isSubmitting ? "등록 중" : "등록"}</span>
          </button>
        </div>
      </form>

      {feedback && (
        <Toast tone={feedback.tone} message={feedback.text} onDismiss={() => setFeedback(null)} />
      )}

      {loadError && loaded && (
        <Toast tone="error" message={loadError} onDismiss={() => setLoadError(null)} />
      )}

      {!loaded ? (
        <StatusPanel
          title="선생님 목록을 불러오는 중입니다"
          description="잠시만 기다려주세요."
          action={<Spinner size="lg" label="선생님 목록 불러오는 중" />}
        />
      ) : teachers.length === 0 ? (
        <StatusPanel
          title="등록된 선생님이 없습니다"
          description="위 양식으로 선생님을 먼저 등록해주세요."
        />
      ) : (
        <>
          <ul className="hidden flex-col gap-2 md:flex">
            <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate">
              <span>이름</span>
              <span className="text-right">동작</span>
            </li>
            {teachers.map((teacher) => (
              <li
                key={teacher.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
              >
                <p className="text-[17px] font-bold text-alpine">{teacher.name}</p>
                <button
                  type="button"
                  onClick={() => setRemoveTargetId(teacher.id)}
                  className="inline-flex min-h-[44px] items-center rounded-lg border border-danger/30 bg-surface px-3 py-1 text-sm font-bold text-danger hover:bg-danger/5"
                >
                  목록에서 제외
                </button>
              </li>
            ))}
          </ul>
          <ul className="flex flex-col gap-2 md:hidden">
            {teachers.map((teacher) => (
              <li
                key={teacher.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4"
              >
                <p className="text-[17px] font-bold text-alpine">{teacher.name}</p>
                <button
                  type="button"
                  onClick={() => setRemoveTargetId(teacher.id)}
                  className="inline-flex min-h-[44px] items-center rounded-lg border border-danger/30 bg-surface px-3 py-2 text-sm font-bold text-danger hover:bg-danger/5"
                >
                  제외
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <Modal
        open={removeTarget !== null}
        title="선생님 제외 확인"
        onClose={() => {
          if (!isRemoving) setRemoveTargetId(null);
        }}
      >
        <div className="flex flex-col gap-4">
          <p className="text-[15px] leading-6 text-alpine">
            {removeTarget && (
              <>
                <span className="font-bold">{removeTarget.name} 선생님</span>을 목록에서
                제외할까요?
              </>
            )}
          </p>
          <p className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm leading-5 text-slate">
            제외해도 이미 만든 반과 배정 기록은 삭제되지 않습니다. 이후 반편성 화면에서 이
            선생님을 새로 선택할 수 없게 됩니다.
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
              {isRemoving && <Spinner size="sm" label="제외 중" />}
              <span>{isRemoving ? "제외 중" : "목록에서 제외"}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
