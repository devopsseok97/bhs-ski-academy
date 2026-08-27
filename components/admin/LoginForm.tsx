"use client";

import { useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/brand/BrandLogo";
import Spinner from "@/components/ui/Spinner";
import { seoulDate } from "@/lib/dates";

const NETWORK_ERROR = "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
const INVALID_ERROR = "비밀번호가 올바르지 않습니다.";
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function todayParts() {
  const iso = seoulDate();
  const [year, month, day] = iso.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return { month, day, weekday };
}

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const today = todayParts();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting || !password) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        window.location.reload();
        return;
      }

      setError(INVALID_ERROR);
      setIsSubmitting(false);
    } catch {
      setError(NETWORK_ERROR);
      setIsSubmitting(false);
    }
  };

  const disabled = isSubmitting || password.trim().length === 0;

  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr] bg-ice lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)] lg:grid-rows-1">
      <aside className="relative isolate overflow-hidden bg-alpine text-white">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(140deg,#081a2c_0%,#102a43_55%,#143957_100%)]" />
        <div className="flex h-full flex-col justify-between gap-10 px-6 py-8 sm:px-10 sm:py-10 lg:px-16 lg:py-14">
          <div className="flex items-center justify-between gap-4">
            <BrandLogo inverse priority />
            <span className="rounded-full border border-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-sky">
              운영 콘솔
            </span>
          </div>

          <div className="hidden lg:block">
            <p className="text-[13px] font-bold tracking-[0.18em] text-sky">오늘</p>
            <div className="mt-3 flex items-end gap-4">
              <span
                className="font-black leading-none tracking-[-0.06em] text-white"
                style={{ fontSize: "clamp(120px, 14vw, 200px)" }}
              >
                {today.day}
              </span>
              <div className="mb-4 flex flex-col text-white/70">
                <span className="text-xl font-bold text-white">{today.month}월</span>
                <span className="text-sm">{today.weekday}요일</span>
              </div>
            </div>
            <p className="mt-8 max-w-sm text-sm leading-6 text-white/60">
              반편성, 아이·쿠폰, 선생님 관리 화면입니다. 학부모용 반편성표는 로그인 없이 볼 수 있습니다.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-white/40 lg:hidden">
            <span>{today.month}월</span>
            <span className="text-2xl font-black leading-none tabular-nums text-white">
              {today.day}
            </span>
            <span>{today.weekday}</span>
          </div>
        </div>
      </aside>

      <main className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-16">
        <div className="w-full max-w-md">
          <h1 className="text-[36px] font-black leading-none tracking-[-0.03em] text-alpine sm:text-[40px]">
            로그인
          </h1>
          <p className="mt-3 text-[15px] leading-6 text-slate">
            운영 콘솔 접근은 비밀번호가 필요합니다.
          </p>

          <form onSubmit={submit} className="mt-8 flex flex-col gap-4" noValidate>
            <label className="flex flex-col gap-2 text-sm font-bold text-alpine">
              비밀번호
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                inputMode="text"
                autoFocus
                disabled={isSubmitting}
                aria-invalid={error ? "true" : undefined}
                aria-describedby={error ? "login-error" : undefined}
                className="min-h-[56px] rounded-xl border-2 border-border bg-surface px-4 py-3 text-lg tracking-widest text-alpine placeholder:text-slate placeholder:tracking-normal focus:border-summit focus:outline-none disabled:cursor-not-allowed disabled:bg-ice"
                placeholder="비밀번호"
              />
            </label>

            {error && (
              <p
                id="login-error"
                role="alert"
                className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-bold leading-5 text-danger"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={disabled}
              className="mt-2 inline-flex min-h-[56px] items-center justify-center gap-2 rounded-xl bg-alpine px-5 py-3 text-base font-black tracking-[-0.01em] text-white transition hover:bg-summit disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && <Spinner size="sm" label="로그인 처리 중" />}
              <span>{isSubmitting ? "확인 중" : "로그인"}</span>
            </button>
          </form>

          <p className="mt-10 border-t border-border pt-6 text-xs leading-5 text-slate">
            학부모용 반편성표는{" "}
            <Link
              href="/"
              className="font-bold text-summit underline-offset-2 hover:underline"
            >
              메인 페이지
            </Link>
            에서 바로 확인할 수 있습니다.
          </p>
        </div>
      </main>
    </div>
  );
}
