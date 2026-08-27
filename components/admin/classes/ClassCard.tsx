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
  const ribbon = isAm ? "bg-sky" : "bg-sunset";
  const eyebrow = isAm ? "text-summit" : "text-sunset";
  const badgeBorder = isAm ? "border-sky/40 text-summit" : "border-sunset/40 text-sunset";

  return (
    <article className="flex overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div aria-hidden="true" className={`w-2.5 shrink-0 ${ribbon}`} />
      <div className="min-w-0 flex-1 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={`text-[11px] font-bold tracking-[0.14em] ${eyebrow}`}>
              {isAm ? "오전" : "오후"}
            </p>
            <h3 className="mt-1 break-words text-[22px] font-black leading-[1.15] tracking-[-0.025em] text-alpine sm:text-2xl">
              {klass.teacher.name}
              <span className="ml-1 text-base font-bold text-slate">선생님</span>
            </h3>
          </div>
          <span
            className={`shrink-0 rounded-full border bg-surface px-3 py-1 text-sm font-bold ${badgeBorder}`}
          >
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
                    className={`flex items-center justify-between gap-3 overflow-hidden rounded-xl border ${
                      lowBalance
                        ? "border-danger/30 bg-danger/5"
                        : "border-transparent bg-ice"
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2">
                      <span
                        aria-hidden="true"
                        className={`h-8 w-1 shrink-0 rounded-full ${
                          lowBalance ? "bg-danger" : isAm ? "bg-sky/60" : "bg-sunset/60"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-[18px] font-bold leading-6 text-alpine">
                          {assignment.student.name}
                        </p>
                        <p
                          className={`text-xs font-bold leading-5 ${
                            lowBalance ? "text-danger" : "text-slate"
                          }`}
                        >
                          남은 {assignment.balance}회{lowBalance && " · 쿠폰 부족"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onUnassign(assignment.id)}
                      disabled={removing || pendingClassAction !== null}
                      aria-label={`${assignment.student.name} 배정 취소`}
                      className="mr-2 inline-flex min-h-[40px] min-w-[64px] items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-bold text-alpine hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
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
