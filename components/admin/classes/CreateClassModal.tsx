"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";

type CreateClassModalProps = {
  open: boolean;
  date: string;
  initialSlot: "AM" | "PM";
  teachers: Array<{ id: string; name: string }>;
  isSubmitting: boolean;
  onSubmit: (input: { slot: "AM" | "PM"; teacherId: string }) => void;
  onClose: () => void;
};

function formatDateLabel(date: string) {
  const [, month = 0, day = 0] = date.split("-").map(Number);
  return `${month}월 ${day}일`;
}

export default function CreateClassModal({
  open,
  date,
  initialSlot,
  teachers,
  isSubmitting,
  onSubmit,
  onClose,
}: CreateClassModalProps) {
  const [slot, setSlot] = useState<"AM" | "PM">(initialSlot);
  const [teacherId, setTeacherId] = useState("");

  const disabled = isSubmitting || teacherId === "";

  return (
    <Modal open={open} title="반 만들기" onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!disabled) onSubmit({ slot, teacherId });
        }}
        className="flex flex-col gap-5"
      >
        <p className="text-sm text-slate">
          <span className="font-bold text-alpine">{formatDateLabel(date)}</span> 반을 새로
          만듭니다.
        </p>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-semibold text-alpine">시간대</legend>
          <div className="flex gap-2">
            {(["AM", "PM"] as const).map((option) => {
              const active = slot === option;
              const isAm = option === "AM";
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSlot(option)}
                  aria-pressed={active}
                  className={`flex flex-1 min-h-[52px] items-center justify-center rounded-xl border px-4 py-3 text-base font-bold transition-colors ${
                    active
                      ? isAm
                        ? "border-sky bg-sky/10 text-summit"
                        : "border-summit bg-summit/10 text-summit"
                      : "border-border bg-surface text-slate hover:bg-ice"
                  }`}
                >
                  {isAm ? "오전" : "오후"}
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="flex flex-col gap-2 text-sm font-semibold text-alpine">
          담당 선생님
          <select
            value={teacherId}
            onChange={(event) => setTeacherId(event.target.value)}
            className="min-h-[52px] rounded-xl border border-border bg-surface px-4 py-3 text-base text-alpine"
          >
            <option value="">선생님을 선택해주세요</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </label>

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
            {isSubmitting && <Spinner size="sm" label="반 생성 중" />}
            <span>{isSubmitting ? "만드는 중" : "반 만들기"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
