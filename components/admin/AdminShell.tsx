"use client";

import type { ReactNode } from "react";
import BrandLogo from "@/components/brand/BrandLogo";
import AdminNavigation, { type AdminTab } from "./AdminNavigation";

type AdminShellProps = {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  children: ReactNode;
};

export default function AdminShell({ activeTab, onTabChange, children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-ice">
      <header className="border-b border-border bg-alpine text-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-4 sm:px-6 md:py-5 lg:px-10">
          <BrandLogo inverse priority />
          <span className="hidden text-sm font-semibold uppercase tracking-[0.16em] text-white/70 md:block">
            관리자
          </span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 pb-32 pt-6 sm:px-6 md:flex-row md:gap-10 md:pb-10 md:pt-10 lg:px-10">
        <AdminNavigation activeTab={activeTab} onTabChange={onTabChange} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
