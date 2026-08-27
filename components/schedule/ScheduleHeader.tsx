import BrandLogo from "@/components/brand/BrandLogo";
import Spinner from "@/components/ui/Spinner";

type ScheduleHeaderProps = {
  today: string;
  tomorrow: string;
  selectedDate: string;
  updatedAt: Date | null;
  isLoading: boolean;
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

  return `마지막 갱신 ${new Intl.DateTimeFormat("ko-KR", {
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
  onSelectDate,
  onRefresh,
}: ScheduleHeaderProps) {
  const dates = [
    { label: "오늘", date: today },
    { label: "내일", date: tomorrow },
  ];

  return (
    <>
      <header className="relative isolate overflow-hidden bg-alpine text-white">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_82%_12%,rgba(77,169,217,0.25),transparent_34%),linear-gradient(135deg,#102a43_0%,#143957_58%,#1f5f8b_130%)]" />
        <svg
          aria-hidden="true"
          viewBox="0 0 1440 250"
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-0 -z-10 h-28 w-full text-white/[0.07] sm:h-40"
        >
          <path
            d="M0 250V190l145-72 110 47 165-123 147 116 92-52 142 96 141-159 120 113 99-49 199 108v35H0Z"
            fill="currentColor"
          />
          <path
            d="m0 212 145-72 110 47L420 64l147 116 92-52 142 96L942 65l120 113 99-49 199 108"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
        </svg>

        <div className="mx-auto max-w-6xl px-4 pb-10 pt-5 sm:px-6 sm:pb-14 sm:pt-7 lg:px-8">
          <BrandLogo compact inverse priority />
          <div className="mt-9 max-w-xl sm:mt-12">
            <p className="text-sm font-bold tracking-[0.16em] text-sky">수업 반편성 안내</p>
            <h1 className="mt-2 text-[34px] font-black leading-[1.15] tracking-[-0.045em] text-white sm:text-5xl">
              설원에서 만날
              <br />
              선생님과 친구들
            </h1>
            <p className="mt-4 text-sm leading-6 text-white/70 sm:text-base">
              선택한 날짜의 오전·오후 반편성을 확인하세요.
            </p>
          </div>
        </div>
      </header>

      <section
        aria-label="조회 날짜 선택"
        className="sticky top-0 z-20 border-b border-border bg-white/95 shadow-[0_12px_35px_-28px_rgba(16,42,67,0.7)] backdrop-blur-md"
      >
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-[0.12em] text-slate">선택한 수업 날짜</p>
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
