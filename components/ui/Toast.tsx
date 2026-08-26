"use client";

import type { ReactNode } from "react";

type ToastProps = {
  message: ReactNode;
  tone?: "success" | "error" | "info";
  onDismiss?: () => void;
};

export default function Toast({ message, tone = "info", onDismiss }: ToastProps) {
  const isError = tone === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${
        isError
          ? "border-danger/25 bg-danger text-white"
          : tone === "success"
            ? "border-success/25 bg-success text-white"
            : "border-border bg-surface text-alpine"
      }`}
    >
      <p className="flex-1 text-sm font-medium leading-5">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="-mr-1 -mt-1 rounded p-1 text-current opacity-80 transition-opacity hover:opacity-100"
          aria-label="알림 닫기"
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </div>
  );
}
