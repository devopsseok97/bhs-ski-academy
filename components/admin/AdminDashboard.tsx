"use client";

import { useState } from "react";
import AdminShell from "./AdminShell";
import type { AdminTab } from "./AdminNavigation";
import ClassBoard from "./ClassBoard";
import EventManager from "./EventManager";
import NoticeManager from "./NoticeManager";
import TeacherManager from "./TeacherManager";
import StudentManager from "./StudentManager";

export default function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>("classes");

  return (
    <AdminShell activeTab={tab} onTabChange={setTab}>
      {tab === "classes" && <ClassBoard />}
      {tab === "students" && <StudentManager />}
      {tab === "teachers" && <TeacherManager />}
      {tab === "events" && <EventManager />}
      {tab === "notices" && <NoticeManager />}
    </AdminShell>
  );
}
