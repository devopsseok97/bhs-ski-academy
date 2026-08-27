import BrandLogo from "@/components/brand/BrandLogo";
import MiniCalendar, { type CalendarEvent } from "@/components/schedule/MiniCalendar";
import NoticeBoard, { type Notice } from "@/components/schedule/NoticeBoard";
import Spinner from "@/components/ui/Spinner";

type ScheduleHeaderProps = {
  today: string;
  tomorrow: string;
  selectedDate: string;
  updatedAt: Date | null;
  isLoading: boolean;
  amCount: number;
  pmCount: number;
  studentCount: number;
  events?: CalendarEvent[];
  notices: Notice[];
  onSelectDate: (date: string) => void;
  onRefresh: () => void;
};

const WEEKDAYS = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

function dateParts(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

export function formatScheduleDate(date: string) {
  const { year, month, day } = dateParts(date);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${year}년 ${month}월 ${day}일 ${weekday}`;
}

function formatShortDate(date: string) {
  const { month, day } = dateParts(date);
  return `${month}월 ${day}일`;
}

function formatUpdatedAt(date: Date | null) {
  if (!date) return "처음 갱신 대기 중";

  return `갱신 ${new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(date)}`;
}

export default function ScheduleHeader({
  today,
  tomorrow,
  selectedDate,
  updatedAt,
  isLoading,
  amCount,
  pmCount,
  studentCount,
  events,
  notices,
  onSelectDate,
  onRefresh,
}: ScheduleHeaderProps) {
  const dates = [
    { label: "오늘", date: today },
    { label: "내일", date: tomorrow },
  ];
  const hasSchedule = amCount + pmCount > 0;

  return (
    <>
      <header className="relative isolate overflow-hidden bg-alpine text-white">
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(140deg,#081a2c_0%,#102a43_55%,#143957_100%)]" />
        <img
          src="/brand/bhs-ski-academy-logo.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 select-none opacity-[0.05] [filter:brightness(0)_invert(1)] sm:h-[600px] sm:w-[600px]"
        />

        <div className="mx-auto max-w-6xl px-4 pb-8 pt-4 sm:px-6 sm:pb-10 sm:pt-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <BrandLogo compact inverse priority />
            <span className="hidden text-[11px] font-bold tracking-[0.16em] text-sky sm:block">
              반편성 안내
            </span>
          </div>

          <div className="mt-6 grid items-start gap-5 sm:mt-8 sm:gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)_minmax(0,340px)]">
            <div className="w-full lg:justify-self-start">
              <MiniCalendar
                today={today}
                selectedDate={selectedDate}
                events={events}
                onSelectDate={onSelectDate}
              />
            </div>

            <NoticeBoard notices={notices} placement="header" />

            <dl className="grid w-full grid-cols-3 gap-px overflow-hidden rounded-2xl bg-white/10 text-center lg:justify-self-end">
              <div className="flex flex-col justify-center bg-white/[0.04] px-4 py-5 sm:px-5">
                <dt className="text-[11px] font-bold tracking-[0.12em] text-sky">오전</dt>
                <dd className="mt-1.5 text-3xl font-black tabular-nums text-white sm:text-4xl">
                  {amCount}
                  <span className="ml-1 text-sm font-bold text-white/60">반</span>
                </dd>
              </div>
              <div className="flex flex-col justify-center bg-white/[0.04] px-4 py-5 sm:px-5">
                <dt className="text-[11px] font-bold tracking-[0.12em] text-sunset">오후</dt>
                <dd className="mt-1.5 text-3xl font-black tabular-nums text-white sm:text-4xl">
                  {pmCount}
                  <span className="ml-1 text-sm font-bold text-white/60">반</span>
                </dd>
              </div>
              <div className="flex flex-col justify-center bg-white/[0.04] px-4 py-5 sm:px-5">
                <dt className="text-[11px] font-bold tracking-[0.12em] text-white/70">학생</dt>
                <dd className="mt-1.5 text-3xl font-black tabular-nums text-white sm:text-4xl">
                  {studentCount}
                  <span className="ml-1 text-sm font-bold text-white/60">명</span>
                </dd>
              </div>
            </dl>
          </div>

          {!hasSchedule && (
            <p className="mt-5 text-sm text-white/60">
              선택한 날짜의 반편성이 아직 등록되지 않았습니다.
            </p>
          )}
        </div>
      </header>

      <section
        aria-label="조회 날짜 선택"
        className="sticky top-0 z-20 border-b border-border bg-white/95 shadow-[0_12px_35px_-28px_rgba(16,42,67,0.7)] backdrop-blur-md"
      >
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-[0.12em] text-slate">보고 있는 날짜</p>
              <p className="mt-0.5 truncate text-base font-extrabold tracking-[-0.02em] text-alpine sm:text-lg">
                {formatScheduleDate(selectedDate)}
              </p>
            </div>
            <button
              type="button"
              aria-label="반편성표 새로고침"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-bold text-summit transition hover:border-sky hover:bg-ice disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none sm:px-4"
            >
              {isLoading ? (
                <Spinner size="sm" label="반편성표 갱신 중" />
              ) : (
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path
                    d="M20 7v5h-5M4 17v-5h5m9.2-4.2A8 8 0 0 0 5.3 6M5.8 16.2A8 8 0 0 0 18.7 18"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              <span className="hidden sm:inline">새로고침</span>
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-ice p-1.5">
            {dates.map(({ label, date }) => {
              const isSelected = selectedDate === date;
              return (
                <button
                  key={date}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onSelectDate(date)}
                  className={`min-h-[44px] rounded-xl px-3 py-2 text-sm font-bold transition motion-reduce:transition-none sm:text-base ${
                    isSelected
                      ? "bg-alpine text-white shadow-sm"
                      : "text-slate hover:bg-white hover:text-alpine"
                  }`}
                >
                  <span>{label}</span>
                  <span className={`ml-1.5 text-xs ${isSelected ? "text-white/65" : "text-slate"}`}>
                    {formatShortDate(date)}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mt-2 flex items-center justify-end gap-1.5 text-xs text-slate">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
              <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
              <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            {formatUpdatedAt(updatedAt)}
          </p>
        </div>
      </section>
    </>
  );
}
