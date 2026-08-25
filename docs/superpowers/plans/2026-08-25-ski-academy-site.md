# BHS 스키아카데미 반편성 사이트 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 학부모가 링크 하나로 반편성표를 확인하고, 관리자가 반배정 시 쿠폰이 자동 차감되는 웹사이트.

**Architecture:** Next.js App Router 단일 앱. 공개 조회 API(`/api/schedule`)와 관리자 API(`/api/admin/*`)를 route handler로 구현. 배정+쿠폰 차감은 Prisma 트랜잭션. 학부모 페이지는 30초 폴링.

**Tech Stack:** Next.js 15 (App Router, TypeScript), Prisma + PostgreSQL, Tailwind CSS, Vitest. 배포는 Railway.

**Spec:** `docs/superpowers/specs/2026-08-25-ski-academy-design.md`

## Global Constraints

- Node 20+, 패키지 매니저는 npm
- UI 라이브러리 추가 금지 (Tailwind만 사용), 상태관리 라이브러리 금지
- 모든 사용자 노출 문구는 한국어
- 날짜는 문자열 `YYYY-MM-DD` (Asia/Seoul 기준), 시간대는 `"AM" | "PM"` 문자열
- 쿠폰 잔액은 항상 `coupon_events`의 delta 합계로 계산 (별도 잔액 컬럼 금지)
- 같은 아이의 중복 배정 제약 없음 (같은 시간대 여러 반 허용, 배정마다 -1)
- 관리자 비밀번호는 `ADMIN_PASSWORD` 환경변수, 학부모 페이지는 인증 없음
- 쿠폰 잔액/이력은 관리자 API에서만 반환. 공개 API 응답에 포함 금지
- UI 태스크(7~9)는 아래 "디자인 지침"을 따른다. 지침과 태스크 내 예시 코드의 Tailwind 클래스가 다르면 지침이 우선

## 디자인 지침 (가독성 최우선)

사용자와 확정한 방향: 장식보다 가독성. "색 띠로 시간대가 구분되는 크고 잘 읽히는 카드".

**색 토큰** (`app/globals.css`의 `@theme`에 정의, Tailwind 유틸로 사용):

```css
@theme {
  --color-snow: #f4f8fb;    /* 배경 */
  --color-navy: #132a45;    /* 본문 텍스트/헤더 */
  --color-am: #2e6fdb;      /* 오전 슬롯 띠/강조 */
  --color-pm: #e8541e;      /* 오후 슬롯 띠/강조 */
  --color-mist: #8fa6bd;    /* 보조 텍스트 */
}
```

**규칙:**

- 폰트: Pretendard 하나만 (CDN: `https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable-dynamic-subset.min.css`). 위계는 굵기·크기로만
- 학부모 화면: 아이 이름 최소 `text-[17px]`, 선생님 이름 `text-xl font-bold`. 본문 텍스트는 navy, 보조는 mist
- 반 카드: 흰 카드 + **상단 컬러 띠** (오전 `--color-am`, 오후 `--color-pm`, 높이 6px 정도). 절취선·노치 등 티켓 장식 금지
- 오전/오후 구분은 항상 색+텍스트 병행 (색만으로 구분 금지)
- 터치 영역(버튼·탭·select)은 최소 44px 높이
- 잔액 0 이하 경고는 빨간 텍스트로만 (배지·아이콘 추가 금지)
- 애니메이션 없음 (폴링 갱신 시 화면 덜컥임 없게 상태 교체만)
- 배경은 전체 `--color-snow`, 카드가 흰색으로 떠 보이는 구조

---

### Task 1: 프로젝트 스캐폴드

**Files:**
- Create: Next.js 프로젝트 전체 (create-next-app), `docker-compose.yml`, `vitest.config.ts`, `.env`, `.env.example`
- Modify: `package.json` (scripts), `.gitignore`

**Interfaces:**
- Produces: 실행 가능한 Next.js 앱, `npm test`로 Vitest 실행, 로컬 Postgres (localhost:5432, db `bhs`)

- [ ] **Step 1: create-next-app 실행** (폴더에 docs/가 있어 임시로 옮겼다가 복원)

```bash
mv docs ../bhs-docs-tmp
npx create-next-app@latest . --typescript --app --tailwind --eslint --no-src-dir --import-alias "@/*" --use-npm --yes
mv ../bhs-docs-tmp docs
```

- [ ] **Step 2: 의존성 설치**

```bash
npm install @prisma/client
npm install -D prisma vitest
```

- [ ] **Step 3: docker-compose.yml 작성** (Docker가 없으면: Railway에 dev용 Postgres를 하나 만들어 그 DATABASE_URL을 .env에 넣는 것으로 대체)

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: bhs
    ports:
      - "5432:5432"
```

- [ ] **Step 4: .env / .env.example 작성, .gitignore 예외 추가**

`.env` (커밋 금지) 와 `.env.example` (커밋) 동일 내용:

```bash
DATABASE_URL="postgresql://postgres:dev@localhost:5432/bhs"
ADMIN_PASSWORD="changeme"
```

`.gitignore` 끝에 추가:

```
!.env.example
```

- [ ] **Step 5: vitest.config.ts 작성 + test 스크립트 추가**

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: { environment: "node" },
  resolve: { alias: { "@": path.resolve(__dirname) } },
});
```

`package.json` scripts에 추가: `"test": "vitest run"`

- [ ] **Step 6: 동작 확인**

```bash
docker compose up -d
npm run dev &
```

`http://localhost:3000` 이 Next.js 기본 페이지를 띄우는지 확인 후 dev 서버 종료. `npm test` 실행 → "no test files found"는 정상.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: Next.js 스캐폴드 + Vitest + Postgres docker-compose"
```

---

### Task 2: Prisma 스키마와 DB 클라이언트

**Files:**
- Create: `prisma/schema.prisma`, `lib/db.ts`

**Interfaces:**
- Produces: `prisma` 싱글턴 (`import { prisma } from "@/lib/db"`), 모델 `Teacher`, `Student`, `CouponEvent`, `Class`, `ClassStudent`

- [ ] **Step 1: prisma/schema.prisma 작성**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Teacher {
  id      String  @id @default(cuid())
  name    String
  active  Boolean @default(true)
  classes Class[]
}

model Student {
  id           String         @id @default(cuid())
  name         String
  memo         String         @default("")
  couponEvents CouponEvent[]
  assignments  ClassStudent[]
}

model CouponEvent {
  id        String   @id @default(cuid())
  studentId String
  delta     Int
  reason    String
  createdAt DateTime @default(now())
  student   Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
}

model Class {
  id          String         @id @default(cuid())
  date        String
  slot        String
  teacherId   String
  teacher     Teacher        @relation(fields: [teacherId], references: [id])
  assignments ClassStudent[]

  @@index([date, slot])
}

model ClassStudent {
  id        String  @id @default(cuid())
  classId   String
  studentId String
  class     Class   @relation(fields: [classId], references: [id], onDelete: Cascade)
  student   Student @relation(fields: [studentId], references: [id], onDelete: Cascade)
}
```

주의: `ClassStudent`에 unique 제약을 걸지 않는다 (같은 아이 중복 배정 허용이 요구사항).

- [ ] **Step 2: 마이그레이션 실행**

```bash
npx prisma migrate dev --name init
```

Expected: `prisma/migrations/` 생성, "Your database is now in sync" 출력.

- [ ] **Step 3: lib/db.ts 작성** (dev 핫리로드 시 커넥션 누수 방지 싱글턴)

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 4: Commit**

```bash
git add prisma lib/db.ts
git commit -m "feat: Prisma 스키마 (선생님/아이/쿠폰이력/반/배정)"
```

---

### Task 3: 쿠폰 잔액·날짜 유틸 (TDD)

**Files:**
- Create: `lib/coupons.ts`, `lib/dates.ts`
- Test: `tests/coupons.test.ts`, `tests/dates.test.ts`

**Interfaces:**
- Produces: `couponBalance(events: { delta: number }[]): number`, `seoulDate(offsetDays?: number): string` (YYYY-MM-DD)

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/coupons.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { couponBalance } from "@/lib/coupons";

describe("couponBalance", () => {
  it("이력이 없으면 0", () => {
    expect(couponBalance([])).toBe(0);
  });
  it("충전/차감/복구 합산", () => {
    expect(
      couponBalance([{ delta: 10 }, { delta: -1 }, { delta: -1 }, { delta: 1 }])
    ).toBe(9);
  });
  it("음수 잔액도 그대로 반환 (0 쿠폰 배치 허용 정책)", () => {
    expect(couponBalance([{ delta: -1 }])).toBe(-1);
  });
});
```

`tests/dates.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { seoulDate } from "@/lib/dates";

describe("seoulDate", () => {
  it("YYYY-MM-DD 형식", () => {
    expect(seoulDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it("내일은 오늘보다 뒤", () => {
    expect(seoulDate(1) > seoulDate()).toBe(true);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test`
Expected: FAIL — "Cannot find module '@/lib/coupons'"

- [ ] **Step 3: 구현**

`lib/coupons.ts`:

```ts
export function couponBalance(events: { delta: number }[]): number {
  return events.reduce((sum, e) => sum + e.delta, 0);
}
```

`lib/dates.ts`:

```ts
export function seoulDate(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(d);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/coupons.ts lib/dates.ts tests
git commit -m "feat: 쿠폰 잔액 합산 및 KST 날짜 유틸"
```

---

### Task 4: 관리자 인증 (TDD)

**Files:**
- Create: `lib/auth.ts`, `lib/guard.ts`, `app/api/admin/login/route.ts`
- Test: `tests/auth.test.ts`

**Interfaces:**
- Produces:
  - `verifyPassword(input: string): boolean`
  - `sessionToken(): string` — ADMIN_PASSWORD 기반 HMAC hex 문자열
  - `isAdmin(): Promise<boolean>` — 요청 쿠키 검사 (route handler 안에서만 호출)
  - `ADMIN_COOKIE: string` — 쿠키 이름 `"bhs_admin"`
  - `requireAdmin(): Promise<NextResponse | null>` — 미인증이면 401 응답, 인증이면 null
  - `POST /api/admin/login` body `{ password }` → 200 + 세션 쿠키 / 401

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/auth.test.ts`:

```ts
import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.ADMIN_PASSWORD = "test-password";
});

describe("auth", () => {
  it("올바른 비밀번호 통과", async () => {
    const { verifyPassword } = await import("@/lib/auth");
    expect(verifyPassword("test-password")).toBe(true);
    expect(verifyPassword("wrong")).toBe(false);
  });
  it("sessionToken은 결정적이며 비밀번호를 노출하지 않음", async () => {
    const { sessionToken } = await import("@/lib/auth");
    expect(sessionToken()).toBe(sessionToken());
    expect(sessionToken()).not.toContain("test-password");
    expect(sessionToken()).toMatch(/^[0-9a-f]{64}$/);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test`
Expected: FAIL — "Cannot find module '@/lib/auth'"

- [ ] **Step 3: lib/auth.ts 구현**

```ts
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
```

`lib/guard.ts`:

```ts
import { NextResponse } from "next/server";
import { isAdmin } from "./auth";

export async function requireAdmin(): Promise<NextResponse | null> {
  if (await isAdmin()) return null;
  return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: 로그인 route 작성** — `app/api/admin/login/route.ts`

```ts
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
```

- [ ] **Step 6: curl로 로그인 확인** (dev 서버 실행 상태에서, .env의 ADMIN_PASSWORD는 "changeme")

```bash
curl -s -X POST localhost:3000/api/admin/login -H 'content-type: application/json' -d '{"password":"wrong"}'
curl -s -c /tmp/bhs.cookies -X POST localhost:3000/api/admin/login -H 'content-type: application/json' -d '{"password":"changeme"}'
```

Expected: 첫 번째 `{"error":"비밀번호가 틀렸습니다"}`, 두 번째 `{"ok":true}` + 쿠키 저장.

- [ ] **Step 7: Commit**

```bash
git add lib/auth.ts lib/guard.ts app/api/admin/login tests/auth.test.ts
git commit -m "feat: 관리자 비밀번호 로그인 및 세션 쿠키"
```

---

### Task 5: 배정 트랜잭션 로직 (통합 테스트, TDD)

**Files:**
- Create: `lib/assignments.ts`, `tests/helpers/db.ts`
- Test: `tests/assignments.test.ts`

**Interfaces:**
- Consumes: `prisma` (Task 2), `couponBalance` (Task 3)
- Produces:
  - `assignStudent(classId: string, studentId: string): Promise<{ id: string }>` — 배정 생성 + CouponEvent(-1, "수업 배정") 한 트랜잭션
  - `unassignStudent(assignmentId: string): Promise<void>` — 배정 삭제 + CouponEvent(+1, "배정 취소")
  - `deleteClass(classId: string): Promise<void>` — 배정된 전원 CouponEvent(+1, "반 삭제") 후 반 삭제
  - `studentBalances(): Promise<Map<string, number>>` — 아이별 잔액 맵

- [ ] **Step 1: 테스트 헬퍼 작성** — `tests/helpers/db.ts` (로컬 Postgres 필요: `docker compose up -d`)

```ts
import { prisma } from "@/lib/db";

export async function resetDb() {
  await prisma.$executeRawUnsafe(
    `TRUNCATE "ClassStudent","CouponEvent","Class","Student","Teacher" CASCADE`
  );
}
```

- [ ] **Step 2: 실패하는 테스트 작성** — `tests/assignments.test.ts`

```ts
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { resetDb } from "./helpers/db";
import {
  assignStudent,
  unassignStudent,
  deleteClass,
  studentBalances,
} from "@/lib/assignments";

async function setup() {
  const teacher = await prisma.teacher.create({ data: { name: "김코치" } });
  const student = await prisma.student.create({ data: { name: "이민준" } });
  await prisma.couponEvent.create({
    data: { studentId: student.id, delta: 10, reason: "쿠폰 충전" },
  });
  const klass = await prisma.class.create({
    data: { date: "2026-12-29", slot: "AM", teacherId: teacher.id },
  });
  return { teacher, student, klass };
}

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("assignStudent", () => {
  it("배정 시 쿠폰 1회 차감", async () => {
    const { student, klass } = await setup();
    await assignStudent(klass.id, student.id);
    expect((await studentBalances()).get(student.id)).toBe(9);
    expect(await prisma.classStudent.count({ where: { classId: klass.id } })).toBe(1);
  });
  it("같은 아이 중복 배정 허용, 각각 차감", async () => {
    const { student, klass } = await setup();
    await assignStudent(klass.id, student.id);
    await assignStudent(klass.id, student.id);
    expect((await studentBalances()).get(student.id)).toBe(8);
  });
  it("잔액 0이어도 배정 가능 (음수 허용)", async () => {
    const { student, klass } = await setup();
    await prisma.couponEvent.create({
      data: { studentId: student.id, delta: -10, reason: "테스트 소진" },
    });
    await assignStudent(klass.id, student.id);
    expect((await studentBalances()).get(student.id)).toBe(-1);
  });
});

describe("unassignStudent", () => {
  it("배정 취소 시 쿠폰 복구", async () => {
    const { student, klass } = await setup();
    const a = await assignStudent(klass.id, student.id);
    await unassignStudent(a.id);
    expect((await studentBalances()).get(student.id)).toBe(10);
    expect(await prisma.classStudent.count()).toBe(0);
  });
});

describe("deleteClass", () => {
  it("반 삭제 시 배정된 전원 쿠폰 복구", async () => {
    const { student, klass } = await setup();
    const other = await prisma.student.create({ data: { name: "박서연" } });
    await prisma.couponEvent.create({
      data: { studentId: other.id, delta: 5, reason: "쿠폰 충전" },
    });
    await assignStudent(klass.id, student.id);
    await assignStudent(klass.id, other.id);
    await deleteClass(klass.id);
    const balances = await studentBalances();
    expect(balances.get(student.id)).toBe(10);
    expect(balances.get(other.id)).toBe(5);
    expect(await prisma.class.count()).toBe(0);
    expect(await prisma.classStudent.count()).toBe(0);
  });
});
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `npm test`
Expected: FAIL — "Cannot find module '@/lib/assignments'"

- [ ] **Step 4: lib/assignments.ts 구현**

```ts
import { prisma } from "./db";

export async function assignStudent(classId: string, studentId: string) {
  return prisma.$transaction(async (tx) => {
    const assignment = await tx.classStudent.create({
      data: { classId, studentId },
    });
    await tx.couponEvent.create({
      data: { studentId, delta: -1, reason: "수업 배정" },
    });
    return assignment;
  });
}

export async function unassignStudent(assignmentId: string) {
  await prisma.$transaction(async (tx) => {
    const assignment = await tx.classStudent.delete({
      where: { id: assignmentId },
    });
    await tx.couponEvent.create({
      data: { studentId: assignment.studentId, delta: 1, reason: "배정 취소" },
    });
  });
}

export async function deleteClass(classId: string) {
  await prisma.$transaction(async (tx) => {
    const assignments = await tx.classStudent.findMany({ where: { classId } });
    if (assignments.length > 0) {
      await tx.couponEvent.createMany({
        data: assignments.map((a) => ({
          studentId: a.studentId,
          delta: 1,
          reason: "반 삭제",
        })),
      });
    }
    await tx.class.delete({ where: { id: classId } });
  });
}

export async function studentBalances(): Promise<Map<string, number>> {
  const groups = await prisma.couponEvent.groupBy({
    by: ["studentId"],
    _sum: { delta: true },
  });
  return new Map(groups.map((g) => [g.studentId, g._sum.delta ?? 0]));
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test`
Expected: PASS (전체)

- [ ] **Step 6: Commit**

```bash
git add lib/assignments.ts tests/helpers tests/assignments.test.ts
git commit -m "feat: 배정/취소/반삭제 트랜잭션 (쿠폰 자동 차감·복구)"
```

---

### Task 6: 관리자 API routes

**Files:**
- Create: `app/api/admin/teachers/route.ts`, `app/api/admin/teachers/[id]/route.ts`, `app/api/admin/students/route.ts`, `app/api/admin/students/[id]/route.ts`, `app/api/admin/students/[id]/coupons/route.ts`, `app/api/admin/classes/route.ts`, `app/api/admin/classes/[id]/route.ts`, `app/api/admin/classes/[id]/students/route.ts`, `app/api/admin/assignments/[id]/route.ts`

**Interfaces:**
- Consumes: `requireAdmin` (Task 4), `assignStudent`/`unassignStudent`/`deleteClass`/`studentBalances` (Task 5), `prisma` (Task 2)
- Produces (모두 인증 필수, 미인증 401):
  - `GET /api/admin/teachers` → `[{ id, name }]` (active만)
  - `POST /api/admin/teachers` `{ name }` → 생성된 teacher
  - `DELETE /api/admin/teachers/[id]` → active=false
  - `GET /api/admin/students` → `[{ id, name, memo, balance }]`
  - `POST /api/admin/students` `{ name, memo? }` → 생성된 student
  - `PATCH /api/admin/students/[id]` `{ name?, memo? }`
  - `POST /api/admin/students/[id]/coupons` `{ amount }` → CouponEvent(+amount, "쿠폰 충전"), 응답 `{ balance }`
  - `GET /api/admin/students/[id]/coupons` → 이력 `[{ delta, reason, createdAt }]` 최신순
  - `GET /api/admin/classes?date=YYYY-MM-DD` → `[{ id, slot, teacher: { id, name }, assignments: [{ id, student: { id, name }, balance }] }]`
  - `POST /api/admin/classes` `{ date, slot, teacherId }` → 생성된 class
  - `DELETE /api/admin/classes/[id]` → 쿠폰 복구 포함 삭제
  - `POST /api/admin/classes/[id]/students` `{ studentId }` → `{ assignmentId, balance }`
  - `DELETE /api/admin/assignments/[id]` → 배정 취소 + 복구

주의: Next.js 15에서 동적 route의 `params`는 Promise다 — `{ params }: { params: Promise<{ id: string }> }` 로 받고 `await params` 한다.

- [ ] **Step 1: teachers routes 작성**

`app/api/admin/teachers/route.ts`:

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const teachers = await prisma.teacher.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return NextResponse.json(teachers);
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { name } = await req.json();
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "이름을 입력해주세요" }, { status: 400 });
  }
  const teacher = await prisma.teacher.create({ data: { name: name.trim() } });
  return NextResponse.json(teacher);
}
```

`app/api/admin/teachers/[id]/route.ts`:

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  await prisma.teacher.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: students routes 작성**

`app/api/admin/students/route.ts`:

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { studentBalances } from "@/lib/assignments";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const [students, balances] = await Promise.all([
    prisma.student.findMany({ orderBy: { name: "asc" } }),
    studentBalances(),
  ]);
  return NextResponse.json(
    students.map((s) => ({
      id: s.id,
      name: s.name,
      memo: s.memo,
      balance: balances.get(s.id) ?? 0,
    }))
  );
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { name, memo } = await req.json();
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "이름을 입력해주세요" }, { status: 400 });
  }
  const student = await prisma.student.create({
    data: { name: name.trim(), memo: typeof memo === "string" ? memo : "" },
  });
  return NextResponse.json(student);
}
```

`app/api/admin/students/[id]/route.ts`:

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const { name, memo } = await req.json();
  const data: { name?: string; memo?: string } = {};
  if (typeof name === "string" && name.trim()) data.name = name.trim();
  if (typeof memo === "string") data.memo = memo;
  const student = await prisma.student.update({ where: { id }, data });
  return NextResponse.json(student);
}
```

`app/api/admin/students/[id]/coupons/route.ts`:

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { couponBalance } from "@/lib/coupons";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const { amount } = await req.json();
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount === 0) {
    return NextResponse.json({ error: "충전 횟수를 확인해주세요" }, { status: 400 });
  }
  await prisma.couponEvent.create({
    data: { studentId: id, delta: amount, reason: amount > 0 ? "쿠폰 충전" : "관리자 조정" },
  });
  const events = await prisma.couponEvent.findMany({ where: { studentId: id } });
  return NextResponse.json({ balance: couponBalance(events) });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const events = await prisma.couponEvent.findMany({
    where: { studentId: id },
    orderBy: { createdAt: "desc" },
    select: { delta: true, reason: true, createdAt: true },
  });
  return NextResponse.json(events);
}
```

- [ ] **Step 3: classes / assignments routes 작성**

`app/api/admin/classes/route.ts`:

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { studentBalances } from "@/lib/assignments";

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const date = new URL(req.url).searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date가 필요합니다" }, { status: 400 });
  const [classes, balances] = await Promise.all([
    prisma.class.findMany({
      where: { date },
      orderBy: [{ slot: "asc" }],
      include: {
        teacher: { select: { id: true, name: true } },
        assignments: { include: { student: { select: { id: true, name: true } } } },
      },
    }),
    studentBalances(),
  ]);
  return NextResponse.json(
    classes.map((c) => ({
      id: c.id,
      slot: c.slot,
      teacher: c.teacher,
      assignments: c.assignments.map((a) => ({
        id: a.id,
        student: a.student,
        balance: balances.get(a.student.id) ?? 0,
      })),
    }))
  );
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { date, slot, teacherId } = await req.json();
  if (
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    (slot !== "AM" && slot !== "PM") ||
    typeof teacherId !== "string"
  ) {
    return NextResponse.json({ error: "입력값을 확인해주세요" }, { status: 400 });
  }
  const klass = await prisma.class.create({ data: { date, slot, teacherId } });
  return NextResponse.json(klass);
}
```

`app/api/admin/classes/[id]/route.ts`:

```ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guard";
import { deleteClass } from "@/lib/assignments";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  await deleteClass(id);
  return NextResponse.json({ ok: true });
}
```

`app/api/admin/classes/[id]/students/route.ts`:

```ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guard";
import { assignStudent, studentBalances } from "@/lib/assignments";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const { studentId } = await req.json();
  if (typeof studentId !== "string") {
    return NextResponse.json({ error: "studentId가 필요합니다" }, { status: 400 });
  }
  const assignment = await assignStudent(id, studentId);
  const balances = await studentBalances();
  return NextResponse.json({
    assignmentId: assignment.id,
    balance: balances.get(studentId) ?? 0,
  });
}
```

`app/api/admin/assignments/[id]/route.ts`:

```ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guard";
import { unassignStudent } from "@/lib/assignments";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  await unassignStudent(id);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: curl로 전체 흐름 검증** (dev 서버 실행, Task 4에서 저장한 쿠키 사용)

```bash
C="-b /tmp/bhs.cookies -H content-type:application/json"
curl -s $C -X POST localhost:3000/api/admin/teachers -d '{"name":"김코치"}'
curl -s $C -X POST localhost:3000/api/admin/students -d '{"name":"이민준"}'
# 위 응답의 id들을 변수로: TID=... SID=...
curl -s $C -X POST localhost:3000/api/admin/students/$SID/coupons -d '{"amount":10}'
curl -s $C -X POST localhost:3000/api/admin/classes -d '{"date":"2026-12-29","slot":"AM","teacherId":"'$TID'"}'
# 응답 id → CID
curl -s $C -X POST localhost:3000/api/admin/classes/$CID/students -d '{"studentId":"'$SID'"}'
curl -s $C localhost:3000/api/admin/students
curl -s localhost:3000/api/admin/students   # 쿠키 없이
```

Expected: 충전 후 `{"balance":10}` → 배정 후 balance 9 → 마지막 쿠키 없는 요청은 `{"error":"인증이 필요합니다"}` (401).

- [ ] **Step 5: Commit**

```bash
git add app/api/admin
git commit -m "feat: 관리자 API (선생님/아이/쿠폰/반/배정)"
```

---

### Task 7: 공개 반편성 API + 학부모 페이지

**Files:**
- Create: `app/api/schedule/route.ts`, `components/ScheduleView.tsx`
- Modify: `app/page.tsx`, `app/layout.tsx`, `app/globals.css`

**Interfaces:**
- Consumes: `prisma` (Task 2), `seoulDate` (Task 3)
- Produces: `GET /api/schedule?date=YYYY-MM-DD` (인증 없음) → `{ date, am: [{ id, teacherName, students: string[] }], pm: [...] }` — 쿠폰 데이터 절대 미포함

- [ ] **Step 1: 공개 API 작성** — `app/api/schedule/route.ts`

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const date = new URL(req.url).searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "날짜 형식이 잘못되었습니다" }, { status: 400 });
  }
  const classes = await prisma.class.findMany({
    where: { date },
    include: {
      teacher: { select: { name: true } },
      assignments: { include: { student: { select: { name: true } } } },
    },
  });
  const toCard = (c: (typeof classes)[number]) => ({
    id: c.id,
    teacherName: c.teacher.name,
    students: c.assignments.map((a) => a.student.name),
  });
  return NextResponse.json({
    date,
    am: classes.filter((c) => c.slot === "AM").map(toCard),
    pm: classes.filter((c) => c.slot === "PM").map(toCard),
  });
}
```

- [ ] **Step 2: 학부모 화면 작성** — `components/ScheduleView.tsx` (클라이언트, 30초 폴링)

```tsx
"use client";

import { useEffect, useState } from "react";

type ClassCard = { id: string; teacherName: string; students: string[] };
type Schedule = { am: ClassCard[]; pm: ClassCard[] };

function Section({ title, classes }: { title: string; classes: ClassCard[] }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-lg font-bold">{title}</h2>
      {classes.length === 0 ? (
        <p className="rounded-lg bg-gray-100 p-4 text-sm text-gray-500">
          아직 반편성 전입니다
        </p>
      ) : (
        <ul className="space-y-3">
          {classes.map((c) => (
            <li key={c.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="mb-1 font-semibold">{c.teacherName} 선생님</p>
              <p className="text-sm text-gray-700">{c.students.join(", ") || "배정된 학생 없음"}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function ScheduleView({ today, tomorrow }: { today: string; tomorrow: string }) {
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
      <h1 className="mb-4 text-xl font-bold">BHS 스키아카데미 반편성표</h1>
      <div className="mb-6 flex gap-2">
        {[
          { label: `오늘 (${today.slice(5)})`, value: today },
          { label: `내일 (${tomorrow.slice(5)})`, value: tomorrow },
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => setDate(t.value)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
              date === t.value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {schedule === null ? (
        <p className="text-center text-sm text-gray-400">불러오는 중...</p>
      ) : (
        <>
          <Section title="오전" classes={schedule.am} />
          <Section title="오후" classes={schedule.pm} />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: app/page.tsx 교체**

```tsx
import ScheduleView from "@/components/ScheduleView";
import { seoulDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default function Home() {
  return <ScheduleView today={seoulDate()} tomorrow={seoulDate(1)} />;
}
```

`app/layout.tsx`의 metadata를 `{ title: "BHS 스키아카데미", description: "반편성표 확인" }` 으로 수정. `lang="ko"` 로 변경. `<head>`에 Pretendard CDN 링크 추가, `body`에 `bg-snow text-navy` 적용. `app/globals.css`에 디자인 지침의 `@theme` 토큰 추가, create-next-app 기본 데모 스타일/에셋 제거. 반 카드 상단에 슬롯 컬러 띠(`h-1.5`, 오전 `bg-am`/오후 `bg-pm`) 적용.

- [ ] **Step 4: 브라우저 검증**

dev 서버에서 `http://localhost:3000` 접속 → Task 6에서 만든 2026-12-29 데이터는 오늘/내일이 아니므로, curl로 오늘 날짜 반을 하나 만들고 배정한 뒤 화면에 나타나는지 확인. 오늘/내일 탭 전환, 배정 없는 날 "아직 반편성 전입니다" 문구 확인.

- [ ] **Step 5: Commit**

```bash
git add app components
git commit -m "feat: 공개 반편성 API + 학부모 페이지 (30초 폴링)"
```

---

### Task 8: 관리자 UI — 로그인 + 선생님/아이 관리

**Files:**
- Create: `app/admin/page.tsx`, `components/admin/LoginForm.tsx`, `components/admin/AdminDashboard.tsx`, `components/admin/TeacherManager.tsx`, `components/admin/StudentManager.tsx`

**Interfaces:**
- Consumes: `isAdmin` (Task 4), 관리자 API (Task 6)
- Produces: `AdminDashboard`는 탭 3개("반편성", "아이 관리", "선생님 관리")를 렌더. "반편성" 탭은 Task 9의 `ClassBoard`를 렌더할 자리로, 이 태스크에서는 `<p>준비 중</p>` 플레이스홀더를 넣고 Task 9에서 교체.

- [ ] **Step 1: app/admin/page.tsx 작성** (서버 컴포넌트에서 인증 분기)

```tsx
import { isAdmin } from "@/lib/auth";
import LoginForm from "@/components/admin/LoginForm";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  return (await isAdmin()) ? <AdminDashboard /> : <LoginForm />;
}
```

- [ ] **Step 2: LoginForm 작성** — `components/admin/LoginForm.tsx`

```tsx
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
      <h1 className="text-center text-xl font-bold">관리자 로그인</h1>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="비밀번호"
        className="rounded-lg border p-3"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="rounded-lg bg-blue-600 p-3 font-semibold text-white">입장</button>
    </form>
  );
}
```

- [ ] **Step 3: AdminDashboard 작성** — `components/admin/AdminDashboard.tsx`

```tsx
"use client";

import { useState } from "react";
import TeacherManager from "./TeacherManager";
import StudentManager from "./StudentManager";

const TABS = ["반편성", "아이 관리", "선생님 관리"] as const;

export default function AdminDashboard() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("반편성");

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-xl font-bold">BHS 스키아카데미 관리자</h1>
      <div className="mb-6 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              tab === t ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "반편성" && <p>준비 중</p>}
      {tab === "아이 관리" && <StudentManager />}
      {tab === "선생님 관리" && <TeacherManager />}
    </div>
  );
}
```

- [ ] **Step 4: TeacherManager 작성** — `components/admin/TeacherManager.tsx`

```tsx
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
          className="flex-1 rounded-lg border p-2"
        />
        <button className="rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white">
          추가
        </button>
      </form>
      <ul className="space-y-2">
        {teachers.map((t) => (
          <li key={t.id} className="flex items-center justify-between rounded-lg border p-3">
            <span>{t.name}</span>
            <button onClick={() => remove(t.id)} className="text-sm text-red-600">
              제외
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 5: StudentManager 작성** — `components/admin/StudentManager.tsx`

```tsx
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
          className="w-32 rounded-lg border p-2"
        />
        <input
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="메모 (레벨 등)"
          className="flex-1 rounded-lg border p-2"
        />
        <button className="rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white">
          등록
        </button>
      </form>
      <ul className="space-y-2">
        {students.map((s) => (
          <li key={s.id} className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <span className="font-semibold">{s.name}</span>
              {s.memo && <span className="ml-2 text-sm text-gray-500">{s.memo}</span>}
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-semibold ${s.balance <= 0 ? "text-red-600" : ""}`}>
                남은 {s.balance}회
              </span>
              <button onClick={() => charge(s.id)} className="text-sm text-blue-600">
                충전
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 6: 브라우저 검증**

`/admin` 접속 → 틀린 비밀번호로 에러 확인 → "changeme" 로그인 → 선생님 추가/제외, 아이 등록, 쿠폰 충전 후 잔액 갱신 확인.

- [ ] **Step 7: Commit**

```bash
git add app/admin components/admin
git commit -m "feat: 관리자 로그인 + 선생님/아이/쿠폰 관리 UI"
```

---

### Task 9: 관리자 UI — 반편성 보드

**Files:**
- Create: `components/admin/ClassBoard.tsx`
- Modify: `components/admin/AdminDashboard.tsx` ("준비 중" 플레이스홀더를 `<ClassBoard />`로 교체)

**Interfaces:**
- Consumes: `GET/POST /api/admin/classes`, `DELETE /api/admin/classes/[id]`, `POST /api/admin/classes/[id]/students`, `DELETE /api/admin/assignments/[id]`, `GET /api/admin/teachers`, `GET /api/admin/students` (Task 6)

- [ ] **Step 1: ClassBoard 작성** — `components/admin/ClassBoard.tsx`

```tsx
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
      <div className="mb-4 flex items-center gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border p-2"
        />
        {(["AM", "PM"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSlot(s)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              slot === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {s === "AM" ? "오전" : "오후"}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
          <button onClick={load} className="font-semibold underline">
            다시 시도
          </button>
        </div>
      )}

      <div className="mb-6 flex gap-2">
        <select
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
          className="flex-1 rounded-lg border p-2"
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
          className="rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white"
        >
          반 만들기
        </button>
      </div>

      <div className="space-y-4">
        {slotClasses.map((c) => (
          <div key={c.id} className="rounded-xl border p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold">{c.teacher.name} 선생님</p>
              <button onClick={() => removeClass(c.id)} className="text-sm text-red-600">
                반 삭제
              </button>
            </div>
            <ul className="mb-3 space-y-1">
              {c.assignments.map((a) => (
                <li key={a.id} className="flex items-center justify-between text-sm">
                  <span className={a.balance < 0 ? "text-red-600" : ""}>
                    {a.student.name}
                    <span className="ml-2 text-xs text-gray-400">남은 {a.balance}회</span>
                  </span>
                  <button onClick={() => unassign(a.id)} className="text-xs text-gray-500">
                    빼기
                  </button>
                </li>
              ))}
            </ul>
            <select
              value=""
              onChange={(e) => e.target.value && assign(c.id, e.target.value)}
              className="w-full rounded-lg border p-2 text-sm"
            >
              <option value="">+ 아이 배정</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (남은 {s.balance}회{s.balance <= 0 ? " ⚠" : ""})
                </option>
              ))}
            </select>
          </div>
        ))}
        {slotClasses.length === 0 && (
          <p className="rounded-lg bg-gray-100 p-4 text-sm text-gray-500">
            이 시간대에 만든 반이 없습니다
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: AdminDashboard에 연결** — `components/admin/AdminDashboard.tsx`에서 import 추가 후 `{tab === "반편성" && <p>준비 중</p>}` 를 `{tab === "반편성" && <ClassBoard />}` 로 교체.

- [ ] **Step 3: 브라우저 전체 흐름 검증** (스펙의 수동 검증 시나리오)

1. `/admin` → 반편성 탭 → 오늘 날짜 오전에 반 생성
2. 아이 배정 → 아이 관리 탭에서 잔액 1 감소 확인
3. 학부모 페이지 `/` 에서 반과 아이 이름 표시 확인 (30초 내 자동 반영 또는 새로고침)
4. 같은 아이를 같은 반에 한 번 더 배정 → 허용되고 추가 차감 확인
5. "빼기" → 잔액 복구 확인
6. 잔액 0인 아이 배정 → 경고(⚠, 빨간색) 표시되지만 배정됨
7. 반 삭제 → 배정 전원 쿠폰 복구 확인

- [ ] **Step 4: 전체 테스트 재실행**

Run: `npm test` && `npx next build`
Expected: 테스트 전체 PASS, 빌드 성공

- [ ] **Step 5: Commit**

```bash
git add components/admin
git commit -m "feat: 반편성 보드 (반 생성/배정/취소/삭제)"
```

---

### Task 10: Railway 배포 준비

**Files:**
- Modify: `package.json` (scripts), `README.md`

**Interfaces:**
- Produces: Railway에서 빌드·기동 가능한 설정. `build`에 `prisma generate`, `start`에 `prisma migrate deploy` 포함.

- [ ] **Step 1: package.json scripts 수정**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "prisma migrate deploy && next start",
    "test": "vitest run"
  }
}
```

- [ ] **Step 2: 로컬에서 프로덕션 기동 확인**

```bash
npm run build && npm run start
```

Expected: 빌드 성공, `localhost:3000` 정상 응답. 확인 후 종료.

- [ ] **Step 3: README.md 작성** (운영 가이드)

```markdown
# BHS 스키아카데미 반편성 사이트

- 학부모 페이지: `/` (링크 공유용, 로그인 없음)
- 관리자 페이지: `/admin` (ADMIN_PASSWORD로 로그인)

## 로컬 개발
1. `docker compose up -d` (Postgres)
2. `.env.example`을 `.env`로 복사하고 값 확인
3. `npx prisma migrate dev`
4. `npm run dev`

## Railway 배포
1. Railway 프로젝트 생성 → 이 저장소 연결 (또는 `railway up`)
2. Postgres 플러그인 추가
3. 앱 서비스 환경변수 설정:
   - `DATABASE_URL` = Postgres 서비스의 `DATABASE_URL` 참조
   - `ADMIN_PASSWORD` = 사용할 관리자 비밀번호 (기본값 금지)
4. 배포되면 도메인 생성 후 학부모님께 `/` 링크 공유

## 테스트
`docker compose up -d` 후 `npm test`
```

- [ ] **Step 4: 최종 확인 및 Commit**

```bash
npm test && npx next build
git add package.json README.md
git commit -m "chore: Railway 배포 스크립트 및 운영 가이드"
```

- [ ] **Step 5: 실제 Railway 배포는 사용자와 함께 진행** (Railway 계정 필요 — 대시보드에서 저장소 연결, Postgres 추가, 환경변수 입력, 도메인 생성. 배포 후 실제 도메인에서 로그인 → 반 생성 → 학부모 페이지 확인)
