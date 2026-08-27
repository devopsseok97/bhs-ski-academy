export type ScheduleClass = {
  id: string;
  teacherName: string;
  students: string[];
};

type ClassCardProps = {
  scheduleClass: ScheduleClass;
  slot: "AM" | "PM";
};

export default function ClassCard({ scheduleClass, slot }: ClassCardProps) {
  const isMorning = slot === "AM";
  const studentCount = scheduleClass.students.length;

  return (
    <article className="group relative overflow-hidden rounded-[24px] border border-border bg-surface shadow-[0_16px_45px_-32px_rgba(16,42,67,0.55)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_52px_-30px_rgba(16,42,67,0.5)] motion-reduce:transform-none motion-reduce:transition-none">
      <div className={`h-1.5 ${isMorning ? "bg-sky" : "bg-summit"}`} />
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-bold tracking-[0.12em] text-slate">
              {isMorning ? "오전 수업" : "오후 수업"}
            </p>
            <h3 className="break-words text-[22px] font-extrabold tracking-[-0.025em] text-alpine sm:text-2xl">
              {scheduleClass.teacherName} 선생님
            </h3>
          </div>
          <span className="shrink-0 rounded-full border border-border bg-surface-muted px-3 py-1.5 text-sm font-bold text-summit">
            학생 {studentCount}명
          </span>
        </div>

        <div className="mt-5 border-t border-border pt-4">
          {studentCount === 0 ? (
            <p className="text-[17px] leading-7 text-slate">배정된 학생이 없습니다.</p>
          ) : (
            <ul
              aria-label={`${scheduleClass.teacherName} 선생님 학생 명단`}
              className="flex flex-wrap gap-2.5"
            >
              {scheduleClass.students.map((name, index) => (
                <li
                  key={`${scheduleClass.id}-${index}-${name}`}
                  className="rounded-xl bg-ice px-3.5 py-2 text-[17px] font-semibold leading-6 text-alpine"
                >
                  {name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}
