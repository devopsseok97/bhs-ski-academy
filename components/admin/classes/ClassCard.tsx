"use client";

import Spinner from "@/components/ui/Spinner";

export type ClassAssignment = {
  id: string;
  student: { id: string; name: string };
  balance: number;
};

export type ClassSummary = {
  id: string;
  slot: "AM" | "PM";
  teacher: { id: string; name: string };
  assignments: ClassAssignment[];
};

type ClassCardProps = {
  klass: ClassSummary;
  pendingAssignmentId: string | null;
  pendingClassAction: "edit" | "delete" | "assign" | null;
  onEdit: () => void;
  onDelete: () => void;
  onOpenPicker: () => void;
  onUnassign: (assignmentId: string) => void;
};

export default function ClassCard({
  klass,
  pendingAssignmentId,
  pendingClassAction,
  onEdit,
  onDelete,
  onOpenPicker,
  onUnassign,
}: ClassCardProps) {
  const isAm = klass.slot === "AM";
  const count = klass.assignments.length;

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className={`h-1.5 ${isAm ? "bg-sky" : "bg-summit"}`} />
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-[0.12em] text-slate">
              {isAm ? "오전" : "오후"}
            </p>
            <h3 className="mt-1 break-words text-xl font-extrabold text-alpine">
              {klass.teacher.name} 선생님
            </h3>
          </div>
          <span className="shrink-0 rounded-full border border-border bg-surface-muted px-3 py-1 text-sm font-bold text-summit">
            {count}명
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onEdit}
            disabled={pendingClassAction !== null}
            className="inline-flex min-h-[44px] items-center rounded-xl border border-border bg-surface px-4 py-2 text-sm font-bold text-alpine hover:border-summit/40 hover:bg-ice disabled:cursor-not-allowed disabled:opacity-60"
          >
            선생님 변경
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={pendingClassAction !== null}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-danger/30 bg-surface px-4 py-2 text-sm font-bold text-danger hover:bg-danger/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingClassAction === "delete" && <Spinner size="sm" label="반 삭제 중" />}
            반 삭제
          </button>
        </div>

        <div className="mt-4 border-t border-border pt-4">
          {count === 0 ? (
            <p className="text-[15px] leading-6 text-slate">아직 배정된 학생이 없습니다.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {klass.assignments.map((assignment) => {
                const lowBalance = assignment.balance <= 0;
                const removing = pendingAssignmentId === assignment.id;
                return (
                  <li
                    key={assignment.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-ice px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-[17px] font-bold leading-6 text-alpine">
                        {assignment.student.name}
                      </p>
                      <p
                        className={`text-xs font-semibold leading-5 ${
                          lowBalance ? "text-danger" : "text-slate"
                        }`}
                      >
                        남은 {assignment.balance}회{lowBalance && " · 쿠폰 부족"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onUnassign(assignment.id)}
                      disabled={removing || pendingClassAction !== null}
                      aria-label={`${assignment.student.name} 배정 취소`}
                      className="inline-flex min-h-[44px] min-w-[64px] items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-bold text-alpine hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {removing ? <Spinner size="sm" label="배정 취소 중" /> : "빼기"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenPicker}
          disabled={pendingClassAction !== null}
          className="mt-4 inline-flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-alpine px-4 py-2 text-sm font-bold text-white hover:bg-summit disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pendingClassAction === "assign" && <Spinner size="sm" label="배정 중" />}
          <span>학생 배정하기</span>
        </button>
      </div>
    </article>
  );
}
