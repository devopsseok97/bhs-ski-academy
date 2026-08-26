import { NextResponse } from "next/server";
import { isAdmin } from "./auth";

export async function requireAdmin(): Promise<NextResponse | null> {
  if (await isAdmin()) return null;
  return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
}
