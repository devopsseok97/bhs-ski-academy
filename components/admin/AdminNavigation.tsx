"use client";

export type AdminTab = "classes" | "students" | "teachers";

type NavItem = {
  id: AdminTab;
  label: string;
  description: string;
};

const ITEMS: readonly NavItem[] = [
  { id: "classes", label: "반편성", description: "날짜별 오전·오후 반과 학생 배정" },
  { id: "students", label: "아이·쿠폰", description: "학생 등록과 쿠폰 관리" },
  { id: "teachers", label: "선생님", description: "선생님 등록과 상태 관리" },
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
                  className={`flex min-h-[56px] w-full flex-col items-center justify-center gap-0.5 px-2 py-2 text-sm font-semibold transition-colors ${
                    isActive ? "text-summit" : "text-slate"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`block h-1 w-8 rounded-full ${isActive ? "bg-summit" : "bg-transparent"}`}
                  />
                  <span className="text-[15px] leading-5">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <nav
        aria-label="관리자 메뉴"
        className="hidden md:sticky md:top-6 md:block md:w-64 md:shrink-0"
      >
        <ul className="flex flex-col gap-1">
          {ITEMS.map((item) => {
            const isActive = item.id === activeTab;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`w-full min-h-[56px] rounded-xl border px-4 py-3 text-left transition-colors ${
                    isActive
                      ? "border-summit bg-summit text-white shadow-sm"
                      : "border-border bg-surface text-alpine hover:border-summit/40 hover:bg-ice"
                  }`}
                >
                  <span className="block text-base font-bold leading-5">{item.label}</span>
                  <span
                    className={`mt-1 block text-xs leading-4 ${
                      isActive ? "text-white/85" : "text-slate"
                    }`}
                  >
                    {item.description}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
