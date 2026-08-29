"use client";

import { useState } from "react";
import Spinner from "@/components/ui/Spinner";

type StudentFormProps = {
  isSubmitting: boolean;
  onSubmit: (input: { name: string; memo: string }) => Promise<void>;
};

export default function StudentForm({ isSubmitting, onSubmit }: StudentFormProps) {
  const [name, setName] = useState("");
  const [memo, setMemo] = useState("");
  const disabled = isSubmitting || name.trim().length === 0;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (disabled) return;
    await onSubmit({ name: name.trim(), memo: memo.trim() });
    setName("");
    setMemo("");
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5"
    >
      <h2 className="text-lg font-bold text-alpine">수강생 등록</h2>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]">
        <label className="flex flex-col gap-1 text-sm font-semibold text-alpine">
          이름
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="수강생 이름"
            disabled={isSubmitting}
            className="min-h-[48px] rounded-xl border border-border bg-surface px-4 py-2 text-base text-alpine placeholder:text-slate disabled:bg-ice"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-alpine">
          메모
          <input
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            placeholder="레벨, 연락처 등"
            disabled={isSubmitting}
            className="min-h-[48px] rounded-xl border border-border bg-surface px-4 py-2 text-base text-alpine placeholder:text-slate disabled:bg-ice"
          />
        </label>
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-alpine px-5 py-2 text-sm font-bold text-white hover:bg-summit disabled:cursor-not-allowed disabled:opacity-60 sm:self-end"
        >
          {isSubmitting && <Spinner size="sm" label="등록 중" />}
          <span>{isSubmitting ? "등록 중" : "등록"}</span>
        </button>
      </div>
    </form>
  );
}
