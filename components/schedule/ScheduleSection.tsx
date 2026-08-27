import ClassCard, { type ScheduleClass } from "@/components/schedule/ClassCard";

type ScheduleSectionProps = {
  title: "오전" | "오후";
  slot: "AM" | "PM";
  classes: ScheduleClass[];
};

export default function ScheduleSection({ title, slot, classes }: ScheduleSectionProps) {
  const isMorning = slot === "AM";

  return (
    <section aria-labelledby={`schedule-${slot.toLowerCase()}`}>
      <div className="mb-4 flex items-end justify-between gap-4 px-1">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className={`h-9 w-1.5 rounded-full ${isMorning ? "bg-sky" : "bg-summit"}`}
          />
          <div>
            <p className="text-xs font-bold tracking-[0.14em] text-slate">
              {isMorning ? "하루의 첫 수업" : "하루의 두 번째 수업"}
            </p>
            <h2
              id={`schedule-${slot.toLowerCase()}`}
              className="mt-0.5 text-2xl font-extrabold tracking-[-0.03em] text-alpine"
            >
              {title} 반편성
            </h2>
          </div>
        </div>
        <span className="shrink-0 text-sm font-semibold text-slate">총 {classes.length}개 반</span>
      </div>

      {classes.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-border bg-white/70 px-5 py-8 text-center text-sm leading-6 text-slate">
          {title} 수업은 아직 반편성 전입니다.
        </div>
      ) : (
        <ul className="space-y-4">
          {classes.map((scheduleClass) => (
            <li key={scheduleClass.id}>
              <ClassCard scheduleClass={scheduleClass} slot={slot} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
