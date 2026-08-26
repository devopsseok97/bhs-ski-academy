"use client";

import { useState } from "react";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) location.reload();
    else setError("비밀번호가 틀렸습니다");
  };

  return (
    <form onSubmit={submit} className="mx-auto mt-24 flex max-w-xs flex-col gap-3 px-4">
      <h1 className="text-center text-2xl font-bold text-navy">관리자 로그인</h1>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="비밀번호"
        className="rounded-lg border border-mist/40 bg-white p-3 text-navy"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="rounded-lg bg-navy p-3 text-base font-semibold text-white">입장</button>
    </form>
  );
}
