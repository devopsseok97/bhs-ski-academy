import { NextResponse } from "next/server";
import { verifyPassword, sessionToken, ADMIN_COOKIE } from "@/lib/auth";

export async function POST(req: Request) {
  const { password } = await req.json();
  if (typeof password !== "string" || !verifyPassword(password)) {
    return NextResponse.json({ error: "비밀번호가 틀렸습니다" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 90,
    path: "/",
  });
  return res;
}
