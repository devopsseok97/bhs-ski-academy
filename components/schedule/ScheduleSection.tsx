import ClassCard, { type ScheduleClass } from "@/components/schedule/ClassCard";

type ScheduleSectionProps = {
  title: "오전" | "오후";
  slot: "AM" | "PM";
  classes: ScheduleClass[];
};

export default function ScheduleSection({ title, slot, classes }: ScheduleSectionProps) {
  const isMorning = slot === "AM";
  const accent = isMorning ? "text-sky" : "text-sunset";
  const rule = isMorning ? "bg-sky" : "bg-sunset";

  return (
    <section aria-labelledby={`schedule-${slot.toLowerCase()}`}>
      <div className="mb-4 flex items-center justify-between gap-4 px-1">
        <div className="flex items-baseline gap-3">
          <h2
            id={`schedule-${slot.toLowerCase()}`}
            className={`text-3xl font-black tracking-[-0.04em] ${accent}`}
          >
            {title}
          </h2>
          <span className="text-sm font-bold text-slate">{classes.length}개 반</span>
        </div>
        <span aria-hidden="true" className={`h-1 flex-1 max-w-[60%] rounded-full ${rule}`} />
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
