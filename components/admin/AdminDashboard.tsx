"use client";

import { useState } from "react";
import ClassBoard from "./ClassBoard";
import TeacherManager from "./TeacherManager";
import StudentManager from "./StudentManager";

const TABS = ["반편성", "아이 관리", "선생님 관리"] as const;

export default function AdminDashboard() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("반편성");

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold text-navy">BHS 스키아카데미 관리자</h1>
      <div className="mb-6 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-3 text-sm font-semibold ${
              tab === t
                ? "bg-navy text-white"
                : "border border-mist/40 bg-white text-mist"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "반편성" && <ClassBoard />}
      {tab === "아이 관리" && <StudentManager />}
      {tab === "선생님 관리" && <TeacherManager />}
    </div>
  );
}
