"use client";

import { useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";

export type PickerStudent = {
  id: string;
  name: string;
  memo: string;
  balance: number;
};

type StudentPickerProps = {
  open: boolean;
  students: PickerStudent[];
  pendingStudentId: string | null;
  onClose: () => void;
  onPick: (studentId: string) => void;
  title: string;
};

export default function StudentPicker({
  open,
  students,
  pendingStudentId,
  onClose,
  onPick,
  title,
}: StudentPickerProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return students;
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(normalized) ||
        student.memo.toLowerCase().includes(normalized),
    );
  }, [query, students]);

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm font-semibold text-alpine">
          학생 검색
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="이름 또는 메모"
            className="min-h-[48px] rounded-xl border border-border bg-surface px-4 py-3 text-base text-alpine placeholder:text-slate"
          />
        </label>

        <p className="text-xs font-semibold text-slate">
          전체 {students.length}명 · 결과 {filtered.length}명
        </p>

        {filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-surface-muted px-4 py-6 text-center text-sm text-slate">
            {students.length === 0 ? "등록된 학생이 없습니다." : "검색 결과가 없습니다."}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {filtered.map((student) => {
              const lowBalance = student.balance <= 0;
              const isPending = pendingStudentId === student.id;
              return (
                <li key={student.id}>
                  <button
                    type="button"
                    onClick={() => onPick(student.id)}
                    disabled={pendingStudentId !== null}
                    className="flex w-full min-h-[64px] items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-left hover:border-summit/40 hover:bg-ice disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <div className="min-w-0">
                      <p className="text-[17px] font-bold leading-6 text-alpine">{student.name}</p>
                      {student.memo && (
                        <p className="mt-0.5 truncate text-xs text-slate">{student.memo}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          lowBalance
                            ? "bg-danger/10 text-danger"
                            : "bg-surface-muted text-summit"
                        }`}
                      >
                        {lowBalance ? "쿠폰 부족" : `남은 ${student.balance}회`}
                      </span>
                      {isPending && <Spinner size="sm" label="배정 중" />}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}
