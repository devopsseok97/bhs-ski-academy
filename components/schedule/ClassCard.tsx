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
  const ribbon = isMorning ? "bg-sky" : "bg-sunset";
  const chip = isMorning
    ? "bg-ice text-alpine"
    : "bg-sunset-soft text-alpine";
  const badgeBorder = isMorning ? "border-sky/40 text-summit" : "border-sunset/40 text-sunset";

  return (
    <article className="group relative flex overflow-hidden rounded-[24px] border border-border bg-surface shadow-[0_16px_45px_-32px_rgba(16,42,67,0.55)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_52px_-30px_rgba(16,42,67,0.5)] motion-reduce:transform-none motion-reduce:transition-none">
      <div aria-hidden="true" className={`w-3 shrink-0 ${ribbon}`} />
      <div className="min-w-0 flex-1 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="break-words text-[26px] font-black leading-[1.15] tracking-[-0.03em] text-alpine sm:text-[30px]">
            {scheduleClass.teacherName}
            <span className="ml-1 text-lg font-bold text-slate sm:text-xl">선생님</span>
          </h3>
          <span
            className={`shrink-0 rounded-full border bg-surface px-3 py-1.5 text-sm font-bold ${badgeBorder}`}
          >
            {studentCount}명
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
                  className={`rounded-xl px-3.5 py-2 text-[19px] font-semibold leading-6 ${chip}`}
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
