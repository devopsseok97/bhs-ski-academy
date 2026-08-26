import { createHmac } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "bhs_admin";

function password(): string {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) throw new Error("ADMIN_PASSWORD 환경변수가 설정되지 않았습니다");
  return pw;
}

export function verifyPassword(input: string): boolean {
  return input === password();
}

export function sessionToken(): string {
  return createHmac("sha256", password()).update("bhs-admin-session").digest("hex");
}

export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return token === sessionToken();
}
