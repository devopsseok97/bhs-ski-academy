"use client";

import { useState } from "react";
import BrandLogo from "@/components/brand/BrandLogo";
import Spinner from "@/components/ui/Spinner";

const NETWORK_ERROR = "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
const INVALID_ERROR = "비밀번호가 올바르지 않습니다.";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <div className="min-h-screen bg-ice">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
        <div className="mb-8 flex justify-center">
          <BrandLogo priority />
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <h1 className="text-center text-2xl font-bold text-alpine">관리자 로그인</h1>
          <p className="mt-2 text-center text-sm leading-5 text-slate">
            등록된 비밀번호로 로그인해주세요.
          </p>

          <form onSubmit={submit} className="mt-6 flex flex-col gap-4" noValidate>
            <label className="flex flex-col gap-2 text-sm font-semibold text-alpine">
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
                className="min-h-[52px] rounded-xl border border-border bg-surface px-4 py-3 text-base text-alpine placeholder:text-slate disabled:cursor-not-allowed disabled:bg-ice"
                placeholder="비밀번호"
              />
            </label>

            {error && (
              <p
                id="login-error"
                role="alert"
                className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-medium leading-5 text-danger"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={disabled}
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-alpine px-5 py-3 text-base font-bold text-white transition hover:bg-summit disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && <Spinner size="sm" label="로그인 처리 중" />}
              <span>{isSubmitting ? "확인 중" : "로그인"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
