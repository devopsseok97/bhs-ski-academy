"use client";

import { useCallback, useEffect, useState } from "react";
import { seoulDate } from "@/lib/dates";

type Teacher = { id: string; name: string };
type Student = { id: string; name: string; memo: string; balance: number };
type Assignment = { id: string; student: { id: string; name: string }; balance: number };
type Klass = { id: string; slot: "AM" | "PM"; teacher: Teacher; assignments: Assignment[] };

export default function ClassBoard() {
  const [date, setDate] = useState(seoulDate());
  const [slot, setSlot] = useState<"AM" | "PM">("AM");
  const [classes, setClasses] = useState<Klass[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teacherId, setTeacherId] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [c, t, s] = await Promise.all([
        fetch(`/api/admin/classes?date=${date}`),
        fetch("/api/admin/teachers"),
        fetch("/api/admin/students"),
      ]);
      if (!c.ok || !t.ok || !s.ok) throw new Error();
      setClasses(await c.json());
      setTeachers(await t.json());
      setStudents(await s.json());
      setError("");
    } catch {
      setError("불러오기에 실패했습니다");
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn: () => Promise<Response>) => {
    try {
      const res = await fn();
      if (!res.ok) throw new Error();
      setError("");
    } catch {
      setError("요청에 실패했습니다. 다시 시도해주세요.");
    }
    load();
  };

  const createClass = () =>
    teacherId &&
    act(() =>
      fetch("/api/admin/classes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ date, slot, teacherId }),
      })
    );

  const removeClass = (id: string) => {
    if (!confirm("반을 삭제하면 배정된 아이들의 쿠폰이 복구됩니다. 삭제할까요?")) return;
    act(() => fetch(`/api/admin/classes/${id}`, { method: "DELETE" }));
  };

  const assign = (classId: string, studentId: string) =>
    act(() =>
      fetch(`/api/admin/classes/${classId}/students`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ studentId }),
      })
    );

  const unassign = (assignmentId: string) =>
    act(() => fetch(`/api/admin/assignments/${assignmentId}`, { method: "DELETE" }));

  const slotClasses = classes.filter((c) => c.slot === slot);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-mist/40 bg-white p-3 text-navy min-h-[44px]"
        />
        {(["AM", "PM"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSlot(s)}
            className={
              slot === s
                ? s === "AM"
                  ? "rounded-lg px-4 py-3 text-sm font-semibold bg-am text-white"
                  : "rounded-lg px-4 py-3 text-sm font-semibold bg-pm text-white"
                : "rounded-lg px-4 py-3 text-sm font-semibold bg-white text-mist border border-mist/40"
            }
          >
            {s === "AM" ? "오전" : "오후"}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-white border border-red-200 p-3 text-sm text-red-700">
          {error}
          <button onClick={load} className="font-semibold underline text-red-700 py-2 px-2">
            다시 시도
          </button>
        </div>
      )}

      <div className="mb-6 flex gap-2">
        <select
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
          className="flex-1 rounded-lg border border-mist/40 bg-white p-3 text-navy min-h-[44px]"
        >
          <option value="">선생님 선택</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <button
          onClick={createClass}
          className="rounded-lg bg-navy px-4 py-3 text-sm font-semibold text-white"
        >
          반 만들기
        </button>
      </div>

      <div className="space-y-4">
        {slotClasses.map((c) => (
          <div key={c.id} className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className={slot === "AM" ? "h-1.5 bg-am" : "h-1.5 bg-pm"} />
            <div className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xl font-bold text-navy">{c.teacher.name} 선생님</p>
                <button
                  onClick={() => removeClass(c.id)}
                  className="text-sm text-red-600 font-semibold py-3 px-3"
                >
                  반 삭제
                </button>
              </div>
              <ul className="mb-3 space-y-1">
                {c.assignments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between text-navy">
                    <span className={a.balance < 0 ? "text-[17px] text-red-600" : "text-[17px]"}>
                      {a.student.name}
                      <span className="ml-2 text-xs text-mist">남은 {a.balance}회</span>
                    </span>
                    <button
                      onClick={() => unassign(a.id)}
                      className="text-sm text-mist font-semibold py-3 px-3"
                    >
                      빼기
                    </button>
                  </li>
                ))}
              </ul>
              <select
                value=""
                onChange={(e) => e.target.value && assign(c.id, e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-mist/40 bg-white p-3 text-navy"
              >
                <option value="">+ 아이 배정</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (남은 {s.balance}회{s.balance <= 0 ? " ⚠" : ""})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
        {slotClasses.length === 0 && (
          <p className="rounded-lg bg-white border border-mist/30 p-4 text-mist">
            이 시간대에 만든 반이 없습니다
          </p>
        )}
      </div>
    </div>
  );
}
