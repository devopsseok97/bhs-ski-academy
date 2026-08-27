"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import type { ClassSummary } from "./ClassCard";

type EditClassModalProps = {
  open: boolean;
  klass: ClassSummary | null;
  teachers: Array<{ id: string; name: string }>;
  isSubmitting: boolean;
  onSubmit: (teacherId: string) => void;
  onClose: () => void;
};

export default function EditClassModal({
  open,
  klass,
  teachers,
  isSubmitting,
  onSubmit,
  onClose,
}: EditClassModalProps) {
  const [teacherId, setTeacherId] = useState(klass?.teacher.id ?? "");

  const disabled = isSubmitting || teacherId === "" || teacherId === klass?.teacher.id;
  const slotLabel = klass?.slot === "AM" ? "오전" : "오후";

  return (
    <Modal open={open} title="담당 선생님 변경" onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!disabled) onSubmit(teacherId);
        }}
        className="flex flex-col gap-5"
      >
        {klass && (
          <p className="text-sm text-slate">
            <span className="font-bold text-alpine">{slotLabel} · {klass.teacher.name} 선생님</span>{" "}
            반의 담당 선생님을 변경합니다.
          </p>
        )}

        <label className="flex flex-col gap-2 text-sm font-semibold text-alpine">
          새 담당 선생님
          <select
            value={teacherId}
            onChange={(event) => setTeacherId(event.target.value)}
            className="min-h-[52px] rounded-xl border border-border bg-surface px-4 py-3 text-base text-alpine"
          >
            <option value="">선생님을 선택해주세요</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
                {teacher.id === klass?.teacher.id ? " (현재)" : ""}
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
            {isSubmitting && <Spinner size="sm" label="변경 중" />}
            <span>{isSubmitting ? "변경 중" : "변경 저장"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
