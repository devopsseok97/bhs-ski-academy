"use client";

import { useEffect, useState } from "react";

type Student = { id: string; name: string; memo: string; balance: number };

export default function StudentManager() {
  const [students, setStudents] = useState<Student[]>([]);
  const [name, setName] = useState("");
  const [memo, setMemo] = useState("");

  const load = async () => {
    const res = await fetch("/api/admin/students");
    if (res.ok) setStudents(await res.json());
  };
  useEffect(() => {
    load();
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await fetch("/api/admin/students", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, memo }),
    });
    setName("");
    setMemo("");
    load();
  };

  const charge = async (id: string) => {
    const input = prompt("충전할 횟수를 입력하세요 (예: 10)");
    if (!input) return;
    const amount = Number(input);
    if (!Number.isInteger(amount) || amount === 0) {
      alert("정수를 입력해주세요");
      return;
    }
    await fetch(`/api/admin/students/${id}/coupons`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    load();
  };

  return (
    <div>
      <form onSubmit={add} className="mb-4 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="아이 이름"
          className="w-32 rounded-lg border border-mist/40 bg-white p-3 text-navy"
        />
        <input
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="메모 (레벨 등)"
          className="flex-1 rounded-lg border border-mist/40 bg-white p-3 text-navy"
        />
        <button className="rounded-lg bg-navy px-4 py-3 text-sm font-semibold text-white">
          등록
        </button>
      </form>
      <ul className="space-y-2">
        {students.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between rounded-lg border border-mist/30 bg-white p-3 text-navy"
          >
            <div>
              <span className="font-semibold">{s.name}</span>
              {s.memo && (
                <span className="ml-2 text-sm text-mist">{s.memo}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-sm font-semibold ${
                  s.balance <= 0 ? "text-red-600" : "text-navy"
                }`}
              >
                남은 {s.balance}회
              </span>
              <button
                onClick={() => charge(s.id)}
                className="px-2 py-2 text-sm font-semibold text-navy"
              >
                충전
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
