"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import { requestJson } from "@/lib/http";

type HistoryEntry = {
  id: string;
  delta: number;
  reason: string;
  createdAt: string;
};

type CouponHistoryModalProps = {
  open: boolean;
  studentId: string | null;
  studentName: string;
  onClose: () => void;
};

function formatDate(iso: string) {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

export default function CouponHistoryModal({
  open,
  studentId,
  studentName,
  onClose,
}: CouponHistoryModalProps) {
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isLoading = open && studentId !== null && history === null && error === null;

  useEffect(() => {
    if (!open || !studentId) return;

    const controller = new AbortController();
    requestJson<HistoryEntry[]>(
      `/api/admin/students/${studentId}/coupons/history`,
      { signal: controller.signal },
    )
      .then((entries) => {
        if (controller.signal.aborted) return;
        setHistory(entries);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "이력을 불러오지 못했습니다");
      });

    return () => controller.abort();
  }, [open, studentId]);

  return (
    <Modal open={open} title={`${studentName} 쿠폰 이력`} onClose={onClose}>
      {isLoading ? (
        <div className="flex min-h-[120px] items-center justify-center">
          <Spinner size="lg" label="이력 불러오는 중" />
        </div>
      ) : error ? (
        <p
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-medium text-danger"
        >
          {error}
        </p>
      ) : !history || history.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-surface-muted px-4 py-6 text-center text-sm text-slate">
          쿠폰 이력이 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {history.map((entry) => {
            const positive = entry.delta > 0;
            return (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-alpine">{entry.reason}</p>
                  <p className="text-xs text-slate">{formatDate(entry.createdAt)}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${
                    positive
                      ? "bg-success/10 text-success"
                      : "bg-danger/10 text-danger"
                  }`}
                >
                  {positive ? "+" : ""}
                  {entry.delta}회
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
