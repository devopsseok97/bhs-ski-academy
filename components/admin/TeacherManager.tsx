"use client";

import { useEffect, useState } from "react";

type Teacher = { id: string; name: string };

export default function TeacherManager() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [name, setName] = useState("");

  const load = async () => {
    const res = await fetch("/api/admin/teachers");
    if (res.ok) setTeachers(await res.json());
  };
  useEffect(() => {
    load();
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await fetch("/api/admin/teachers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setName("");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("이 선생님을 목록에서 제외할까요?")) return;
    await fetch(`/api/admin/teachers/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div>
      <form onSubmit={add} className="mb-4 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="선생님 이름"
          className="flex-1 rounded-lg border border-mist/40 bg-white p-3 text-navy"
        />
        <button className="rounded-lg bg-navy px-4 py-3 text-sm font-semibold text-white">
          추가
        </button>
      </form>
      <ul className="space-y-2">
        {teachers.map((t) => (
          <li
            key={t.id}
            className="flex items-center justify-between rounded-lg border border-mist/30 bg-white p-3 text-navy"
          >
            <span>{t.name}</span>
            <button
              onClick={() => remove(t.id)}
              className="px-2 py-2 text-sm font-semibold text-red-600"
            >
              제외
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
