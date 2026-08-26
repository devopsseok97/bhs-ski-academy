"use client";

import { useEffect, useState } from "react";

type ClassCard = { id: string; teacherName: string; students: string[] };
type Schedule = { am: ClassCard[]; pm: ClassCard[] };

function Section({
  title,
  classes,
  slot,
}: {
  title: string;
  classes: ClassCard[];
  slot: "AM" | "PM";
}) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-lg font-bold text-navy">{title}</h2>
      {classes.length === 0 ? (
        <p className="rounded-lg bg-white border border-mist/30 p-4 text-mist">
          아직 반편성 전입니다
        </p>
      ) : (
        <ul className="space-y-3">
          {classes.map((c) => (
            <li key={c.id} className="overflow-hidden rounded-xl bg-white shadow-sm">
              <div className={slot === "AM" ? "h-1.5 bg-am" : "h-1.5 bg-pm"} />
              <div className="p-4">
                <p className="mb-2 text-xl font-bold text-navy">{c.teacherName} 선생님</p>
                {c.students.length === 0 ? (
                  <p className="text-[17px] text-mist">배정된 학생 없음</p>
                ) : (
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[17px] text-navy">
                    {c.students.map((name) => (
                      <span key={name}>{name}</span>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function ScheduleView({
  today,
  tomorrow,
}: {
  today: string;
  tomorrow: string;
}) {
  const [date, setDate] = useState(today);
  const [schedule, setSchedule] = useState<Schedule | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/schedule?date=${date}`);
        if (alive && res.ok) setSchedule(await res.json());
      } catch {
        /* 다음 폴링에서 재시도 */
      }
    };
    load();
    const timer = setInterval(load, 30_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [date]);

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">BHS 스키아카데미 반편성표</h1>
      <div className="mb-6 flex gap-2">
        {[
          { label: `오늘 (${today.slice(5)})`, value: today },
          { label: `내일 (${tomorrow.slice(5)})`, value: tomorrow },
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => setDate(t.value)}
            className={
              date === t.value
                ? "flex-1 rounded-lg py-3 text-base font-semibold bg-navy text-white"
                : "flex-1 rounded-lg py-3 text-base font-semibold bg-white text-mist border border-mist/40"
            }
          >
            {t.label}
          </button>
        ))}
      </div>
      {schedule === null ? (
        <p className="text-center text-mist">불러오는 중...</p>
      ) : (
        <>
          <Section title="오전" classes={schedule.am} slot="AM" />
          <Section title="오후" classes={schedule.pm} slot="PM" />
        </>
      )}
    </div>
  );
}
