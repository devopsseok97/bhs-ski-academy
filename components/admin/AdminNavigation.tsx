"use client";

export type AdminTab = "classes" | "students" | "teachers" | "events" | "notices";

type NavItem = {
  id: AdminTab;
  label: string;
  short: string;
  description: string;
};

const ITEMS: readonly NavItem[] = [
  {
    id: "classes",
    label: "반편성",
    short: "반편성",
    description: "날짜별 오전·오후 반과 학생 배정",
  },
  {
    id: "students",
    label: "아이 · 쿠폰",
    short: "아이",
    description: "학생 등록과 쿠폰 관리",
  },
  {
    id: "teachers",
    label: "선생님",
    short: "선생님",
    description: "선생님 등록과 상태 관리",
  },
  {
    id: "events",
    label: "일정",
    short: "일정",
    description: "시합·공지 달력 이벤트",
  },
  {
    id: "notices",
    label: "공지",
    short: "공지",
    description: "학부모 화면 공지 작성과 게시 관리",
  },
];

type AdminNavigationProps = {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
};

export default function AdminNavigation({ activeTab, onTabChange }: AdminNavigationProps) {
  return (
    <>
      <nav
        aria-label="관리자 메뉴"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface md:hidden"
      >
        <ul className="mx-auto flex max-w-2xl">
          {ITEMS.map((item) => {
            const isActive = item.id === activeTab;
            return (
              <li key={item.id} className="flex-1">
                <button
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative flex min-h-[60px] w-full flex-col items-center justify-center px-2 py-2 text-sm font-bold transition-colors ${
                    isActive ? "text-alpine" : "text-slate"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-6 top-0 h-1 rounded-b-full ${
                      isActive ? "bg-alpine" : "bg-transparent"
                    }`}
                  />
                  <span className="text-[15px] leading-5">{item.short}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <nav
        aria-label="관리자 메뉴"
        className="hidden md:sticky md:top-6 md:block md:w-60 md:shrink-0"
      >
        <p className="mb-3 px-1 text-[11px] font-bold tracking-[0.16em] text-slate">메뉴</p>
        <ul className="flex flex-col">
          {ITEMS.map((item) => {
            const isActive = item.id === activeTab;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`group relative flex w-full min-h-[64px] items-center gap-3 border-l-[3px] px-4 py-3 text-left transition-colors ${
                    isActive
                      ? "border-alpine bg-white text-alpine"
                      : "border-transparent bg-transparent text-slate hover:border-summit/40 hover:bg-white/60 hover:text-alpine"
                  }`}
                >
                  <div className="min-w-0">
                    <span
                      className={`block text-[17px] font-black tracking-[-0.01em] ${
                        isActive ? "text-alpine" : "text-slate group-hover:text-alpine"
                      }`}
                    >
                      {item.label}
                    </span>
                    <span
                      className={`mt-0.5 block text-xs leading-4 ${
                        isActive ? "text-summit" : "text-slate/80"
                      }`}
                    >
                      {item.description}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
