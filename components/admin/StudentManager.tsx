"use client";

import { useEffect, useMemo, useState } from "react";
import Spinner from "@/components/ui/Spinner";
import StatusPanel from "@/components/ui/StatusPanel";
import Toast from "@/components/ui/Toast";
import { requestJson } from "@/lib/http";
import StudentForm from "./students/StudentForm";
import CouponChargeModal from "./students/CouponChargeModal";
import CouponHistoryModal from "./students/CouponHistoryModal";

type Student = { id: string; name: string; memo: string; balance: number };
type FilterKey = "all" | "positive" | "low";
type FeedbackMessage = { tone: "success" | "error"; text: string } | null;

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "전체" },
  { key: "positive", label: "쿠폰 있음" },
  { key: "low", label: "쿠폰 부족" },
];

function errorText(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "요청 처리에 실패했습니다. 잠시 후 다시 시도해주세요.";
}

export default function StudentManager() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const [isRegistering, setIsRegistering] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackMessage>(null);

  const [chargeTargetId, setChargeTargetId] = useState<string | null>(null);
  const [isCharging, setIsCharging] = useState(false);

  const [historyTargetId, setHistoryTargetId] = useState<string | null>(null);

  const requestReload = () => setReloadKey((key) => key + 1);

  useEffect(() => {
    const controller = new AbortController();
    requestJson<Student[]>("/api/admin/students", { signal: controller.signal })
      .then((next) => {
        if (controller.signal.aborted) return;
        setStudents(next);
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

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return students.filter((student) => {
      if (filter === "positive" && student.balance <= 0) return false;
      if (filter === "low" && student.balance > 0) return false;
      if (!normalized) return true;
      return (
        student.name.toLowerCase().includes(normalized) ||
        student.memo.toLowerCase().includes(normalized)
      );
    });
  }, [query, filter, students]);

  const chargeTarget = students.find((s) => s.id === chargeTargetId) ?? null;
  const historyTarget = students.find((s) => s.id === historyTargetId) ?? null;

  const handleRegister = async ({ name, memo }: { name: string; memo: string }) => {
    setIsRegistering(true);
    try {
      await requestJson("/api/admin/students", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, memo }),
      });
      requestReload();
      setFeedback({ tone: "success", text: `${name} 학생을 등록했습니다.` });
    } catch (error) {
      setFeedback({ tone: "error", text: errorText(error) });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCharge = async (amount: number) => {
    if (!chargeTargetId) return;
    setIsCharging(true);
    try {
      await requestJson(`/api/admin/students/${chargeTargetId}/coupons`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      requestReload();
      setChargeTargetId(null);
      setFeedback({
        tone: "success",
        text: `쿠폰을 ${amount > 0 ? "충전" : "차감"}했습니다.`,
      });
    } catch (error) {
      setFeedback({ tone: "error", text: errorText(error) });
    } finally {
      setIsCharging(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-alpine">아이·쿠폰</h1>
        <p className="text-sm text-slate">
          학생을 등록하고 쿠폰을 관리하세요. 배정과 취소는 반편성 화면에서 처리합니다.
        </p>
      </header>

      <StudentForm isSubmitting={isRegistering} onSubmit={handleRegister} />

      <section
        aria-label="학생 검색"
        className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5"
      >
        <label className="flex flex-col gap-2 text-sm font-semibold text-alpine">
          이름 또는 메모 검색
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="이름 또는 메모"
            className="min-h-[48px] rounded-xl border border-border bg-surface px-4 py-3 text-base text-alpine placeholder:text-slate"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((option) => {
            const active = option.key === filter;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setFilter(option.key)}
                aria-pressed={active}
                className={`inline-flex min-h-[44px] items-center rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${
                  active
                    ? "border-alpine bg-alpine text-white"
                    : "border-border bg-surface text-alpine hover:bg-ice"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs font-semibold text-slate">
          전체 {students.length}명 · 결과 {filtered.length}명
        </p>
      </section>

      {feedback && (
        <Toast tone={feedback.tone} message={feedback.text} onDismiss={() => setFeedback(null)} />
      )}

      {loadError && loaded && (
        <Toast tone="error" message={loadError} onDismiss={() => setLoadError(null)} />
      )}

      {!loaded ? (
        <StatusPanel
          title="학생 목록을 불러오는 중입니다"
          description="잠시만 기다려주세요."
          action={<Spinner size="lg" label="학생 목록 불러오는 중" />}
        />
      ) : filtered.length === 0 ? (
        <StatusPanel
          title={
            students.length === 0
              ? "등록된 학생이 없습니다"
              : "검색 결과가 없습니다"
          }
          description={
            students.length === 0
              ? "위 양식으로 학생을 먼저 등록하세요."
              : "다른 검색어나 필터를 시도해보세요."
          }
        />
      ) : (
        <ul className="hidden flex-col gap-2 md:flex">
          <li className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate">
            <span>이름</span>
            <span>메모</span>
            <span className="text-right">잔액</span>
            <span className="text-right">동작</span>
          </li>
          {filtered.map((student) => {
            const lowBalance = student.balance <= 0;
            return (
              <li
                key={student.id}
                className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
              >
                <p className="text-[17px] font-bold text-alpine">{student.name}</p>
                <p className="truncate text-sm text-slate">{student.memo || "—"}</p>
                <p
                  className={`text-right text-base font-bold ${
                    lowBalance ? "text-danger" : "text-summit"
                  }`}
                >
                  {lowBalance ? `${student.balance}회 · 부족` : `${student.balance}회`}
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setChargeTargetId(student.id)}
                    className="inline-flex min-h-[44px] items-center rounded-lg border border-border bg-surface px-3 py-1 text-sm font-bold text-alpine hover:bg-ice"
                  >
                    쿠폰 조정
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryTargetId(student.id)}
                    className="inline-flex min-h-[44px] items-center rounded-lg border border-border bg-surface px-3 py-1 text-sm font-bold text-alpine hover:bg-ice"
                  >
                    이력
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {loaded && filtered.length > 0 && (
        <ul className="flex flex-col gap-2 md:hidden">
          {filtered.map((student) => {
            const lowBalance = student.balance <= 0;
            return (
              <li
                key={student.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[17px] font-bold leading-6 text-alpine">{student.name}</p>
                    {student.memo && (
                      <p className="mt-1 truncate text-sm text-slate">{student.memo}</p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${
                      lowBalance ? "bg-danger/10 text-danger" : "bg-surface-muted text-summit"
                    }`}
                  >
                    {lowBalance ? `${student.balance}회 · 부족` : `${student.balance}회`}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setChargeTargetId(student.id)}
                    className="inline-flex flex-1 min-h-[44px] items-center justify-center rounded-lg border border-border bg-surface px-3 py-2 text-sm font-bold text-alpine hover:bg-ice"
                  >
                    쿠폰 조정
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryTargetId(student.id)}
                    className="inline-flex flex-1 min-h-[44px] items-center justify-center rounded-lg border border-border bg-surface px-3 py-2 text-sm font-bold text-alpine hover:bg-ice"
                  >
                    이력 보기
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <CouponChargeModal
        open={chargeTarget !== null}
        studentName={chargeTarget?.name ?? ""}
        currentBalance={chargeTarget?.balance ?? 0}
        isSubmitting={isCharging}
        onSubmit={handleCharge}
        onClose={() => {
          if (!isCharging) setChargeTargetId(null);
        }}
      />

      <CouponHistoryModal
        open={historyTarget !== null}
        studentId={historyTargetId}
        studentName={historyTarget?.name ?? ""}
        onClose={() => setHistoryTargetId(null)}
      />
    </div>
  );
}
