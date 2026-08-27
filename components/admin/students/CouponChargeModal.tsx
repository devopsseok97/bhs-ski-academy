"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";

type CouponChargeModalProps = {
  open: boolean;
  studentName: string;
  currentBalance: number;
  isSubmitting: boolean;
  onSubmit: (amount: number) => void;
  onClose: () => void;
};

export default function CouponChargeModal({
  open,
  studentName,
  currentBalance,
  isSubmitting,
  onSubmit,
  onClose,
}: CouponChargeModalProps) {
  const [amount, setAmount] = useState("");
  const parsed = Number(amount);
  const isValid =
    amount.trim().length > 0 && Number.isInteger(parsed) && parsed !== 0 && Math.abs(parsed) <= 999;
  const projected = isValid ? currentBalance + parsed : currentBalance;
  const disabled = isSubmitting || !isValid;

  return (
    <Modal open={open} title={`${studentName} 쿠폰 조정`} onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!disabled) onSubmit(parsed);
        }}
        className="flex flex-col gap-5"
      >
        <div className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-slate">
          <p>
            <span className="font-bold text-alpine">현재 잔액</span>{" "}
            <span className="text-alpine">{currentBalance}회</span>
          </p>
        </div>

        <label className="flex flex-col gap-2 text-sm font-semibold text-alpine">
          증감 횟수 (충전은 양수, 차감은 음수)
          <input
            type="number"
            inputMode="numeric"
            step={1}
            min={-999}
            max={999}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="예: 10"
            disabled={isSubmitting}
            autoFocus
            className="min-h-[52px] rounded-xl border border-border bg-surface px-4 py-3 text-base text-alpine placeholder:text-slate disabled:bg-ice"
          />
        </label>

        <p className="text-sm leading-6 text-alpine">
          처리 후 예상 잔액:{" "}
          <span
            className={`text-lg font-bold ${projected <= 0 ? "text-danger" : "text-summit"}`}
          >
            {projected}회
          </span>
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex min-h-[48px] items-center rounded-xl border border-border bg-surface px-4 py-2 text-sm font-bold text-alpine hover:bg-ice disabled:cursor-not-allowed disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={disabled}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-alpine px-5 py-2 text-sm font-bold text-white hover:bg-summit disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <Spinner size="sm" label="처리 중" />}
            <span>{isSubmitting ? "처리 중" : "적용"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
