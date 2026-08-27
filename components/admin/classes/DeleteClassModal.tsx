"use client";

import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import type { ClassSummary } from "./ClassCard";

type DeleteClassModalProps = {
  open: boolean;
  klass: ClassSummary | null;
  isSubmitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export default function DeleteClassModal({
  open,
  klass,
  isSubmitting,
  onConfirm,
  onClose,
}: DeleteClassModalProps) {
  const count = klass?.assignments.length ?? 0;
  const slotLabel = klass?.slot === "AM" ? "오전" : "오후";

  return (
    <Modal open={open} title="반 삭제 확인" onClose={onClose}>
      <div className="flex flex-col gap-4">
        {klass && (
          <p className="text-[15px] leading-6 text-alpine">
            <span className="font-bold">{slotLabel} · {klass.teacher.name} 선생님</span> 반을
            삭제할까요?
          </p>
        )}
        <div className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm leading-5 text-slate">
          {count > 0 ? (
            <p>
              배정된 학생 {count}명의 쿠폰이 각각 1회씩{" "}
              <span className="font-bold text-summit">자동으로 복구</span>됩니다.
            </p>
          ) : (
            <p>배정된 학생이 없어 쿠폰 변동은 발생하지 않습니다.</p>
          )}
        </div>
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
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-danger px-5 py-2 text-sm font-bold text-white hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <Spinner size="sm" label="삭제 중" />}
            <span>{isSubmitting ? "삭제 중" : "반 삭제"}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
