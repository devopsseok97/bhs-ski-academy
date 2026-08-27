"use client";

import type { ReactNode } from "react";
import BrandLogo from "@/components/brand/BrandLogo";
import { seoulDate } from "@/lib/dates";
import AdminNavigation, { type AdminTab } from "./AdminNavigation";

type AdminShellProps = {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  children: ReactNode;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function todayParts() {
  const iso = seoulDate();
  const [year, month, day] = iso.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return { year, month, day, weekday };
}

export default function AdminShell({ activeTab, onTabChange, children }: AdminShellProps) {
  const today = todayParts();

  return (
    <div className="min-h-screen bg-ice">
      <header className="relative isolate overflow-hidden bg-alpine text-white">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(140deg,#081a2c_0%,#102a43_55%,#143957_100%)]" />
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-4 py-4 sm:px-6 md:py-5 lg:px-10">
          <BrandLogo inverse priority />
          <div className="flex items-center gap-3 text-right">
            <span className="hidden text-[11px] font-bold uppercase tracking-[0.16em] text-sky sm:block">
              운영 콘솔
            </span>
            <div className="flex items-baseline gap-1.5 rounded-xl bg-white/10 px-3 py-1.5">
              <span className="text-[11px] font-bold tracking-[0.14em] text-white/70">
                {today.month}월
              </span>
              <span className="text-2xl font-black tabular-nums leading-none">{today.day}</span>
              <span className="text-[11px] font-bold text-white/60">{today.weekday}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 pb-32 pt-6 sm:px-6 md:flex-row md:gap-10 md:pb-10 md:pt-10 lg:px-10">
        <AdminNavigation activeTab={activeTab} onTabChange={onTabChange} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
