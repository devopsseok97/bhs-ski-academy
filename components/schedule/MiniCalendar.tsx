"use client";

export type CalendarEvent = {
  date: string;
  label: string;
  tone?: "competition" | "notice";
};

type MiniCalendarProps = {
  today: string;
  selectedDate: string;
  events?: CalendarEvent[];
  onSelectDate?: (date: string) => void;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function toIso(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseIso(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month, day };
}

function buildMonthGrid(anchor: string) {
  const { year, month } = parseIso(anchor);
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const startWeekday = firstOfMonth.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const cells: Array<{ iso: string; day: number; inMonth: boolean }> = [];

  for (let i = 0; i < startWeekday; i += 1) {
    const previous = new Date(Date.UTC(year, month - 1, -i));
    cells.unshift({
      iso: toIso(previous.getUTCFullYear(), previous.getUTCMonth() + 1, previous.getUTCDate()),
      day: previous.getUTCDate(),
      inMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ iso: toIso(year, month, day), day, inMonth: true });
  }

  while (cells.length % 7 !== 0 || cells.length < 42) {
    const nextDay = cells.length - startWeekday - daysInMonth + 1;
    const next = new Date(Date.UTC(year, month - 1, daysInMonth + nextDay));
    cells.push({
      iso: toIso(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate()),
      day: next.getUTCDate(),
      inMonth: false,
    });
    if (cells.length >= 42) break;
  }

  return { year, month, cells };
}

export default function MiniCalendar({
  today,
  selectedDate,
  events = [],
  onSelectDate,
}: MiniCalendarProps) {
  const eventMap = new Map<string, CalendarEvent>();
  for (const event of events) eventMap.set(event.date, event);

  const { year, month, cells } = buildMonthGrid(selectedDate);
  const interactive = typeof onSelectDate === "function";

  return (
    <div className="flex h-full w-full flex-col rounded-2xl bg-white/[0.06] p-4 backdrop-blur-sm sm:p-5">
      <div className="flex items-baseline justify-between">
        <p className="flex items-baseline gap-2 text-white">
          <span className="text-xl font-black tabular-nums sm:text-2xl">{month}월</span>
          <span className="text-[11px] font-bold tracking-[0.14em] text-white/50">{year}</span>
        </p>
        <p className="text-[11px] font-bold tracking-[0.14em] text-sky">이번 달</p>
      </div>

      <div
        role="grid"
        aria-label={`${year}년 ${month}월 달력`}
        className="mt-4 grid grid-cols-7 gap-y-1"
      >
        {WEEKDAYS.map((label, index) => (
          <div
            key={label}
            role="columnheader"
            className={`pb-2 text-center text-[10px] font-bold tracking-[0.14em] ${
              index === 0 ? "text-sunset/80" : index === 6 ? "text-sky/80" : "text-white/45"
            }`}
          >
            {label}
          </div>
        ))}

        {cells.map(({ iso, day, inMonth }, index) => {
          const isToday = iso === today;
          const isSelected = iso === selectedDate;
          const event = eventMap.get(iso);
          const weekday = index % 7;
          const baseText = !inMonth
            ? "text-white/20"
            : weekday === 0
              ? "text-sunset/70"
              : weekday === 6
                ? "text-sky/70"
                : "text-white/85";

          const dayLabel = event
            ? `${month}월 ${day}일 · ${event.label}`
            : `${month}월 ${day}일`;

          const content = (
            <span
              className={`relative flex h-9 w-9 items-center justify-center rounded-full text-[15px] font-bold tabular-nums transition-colors ${
                isSelected
                  ? "bg-sunset text-white shadow-[0_0_0_2px_rgba(234,115,23,0.35)]"
                  : isToday
                    ? "border border-white/50 text-white"
                    : baseText
              }`}
            >
              {day}
              {event && (
                <span
                  aria-hidden="true"
                  className={`absolute -bottom-0.5 h-1 w-1 rounded-full ${
                    isSelected
                      ? "bg-white"
                      : event.tone === "notice"
                        ? "bg-sky"
                        : "bg-sunset"
                  }`}
                />
              )}
            </span>
          );

          return (
            <div
              key={`${iso}-${index}`}
              role="gridcell"
              aria-selected={isSelected}
              className="flex items-center justify-center"
            >
              {interactive ? (
                <button
                  type="button"
                  onClick={() => onSelectDate?.(iso)}
                  aria-label={dayLabel}
                  aria-current={isToday ? "date" : undefined}
                  className="flex h-10 w-10 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky"
                >
                  {content}
                </button>
              ) : (
                <span aria-label={dayLabel} aria-current={isToday ? "date" : undefined}>
                  {content}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
