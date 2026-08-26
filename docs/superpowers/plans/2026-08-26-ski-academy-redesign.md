# BHS 스키아카데미 전면 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공식 로고와 프리미엄 알파인 디자인을 적용하고, 모바일·PC에서 반편성·학생·쿠폰·선생님 관리가 전문적이고 체계적으로 동작하도록 전면 개선한다.

**Architecture:** 기존 Next.js App Router와 Prisma 데이터 모델은 유지한다. 페이지는 Server Component로 두고 상호작용이 필요한 작은 Client Component 경계를 사용한다. 공통 브랜드·피드백 컴포넌트를 만들고, 관리자 화면은 동일 데이터와 동작을 모바일 단일 열/PC 사이드바·다단 레이아웃으로 CSS에서 재배치한다.

**Tech Stack:** Next.js 16.3.2 App Router, React 19.2.8, TypeScript, Tailwind CSS 4, Prisma 7/PostgreSQL, Vitest

**Spec:** `docs/superpowers/specs/2026-08-26-ski-academy-redesign-design.md`

## Global Constraints

- `node_modules/next/dist/docs/`의 설치된 Next.js 16.3.2 문서를 구현 전 기준으로 사용한다.
- 사용자가 제공한 `/Users/gimhyeongseog/Desktop/배호성 동그라미 로고.PNG`의 원본 형태를 변형하지 않는다.
- 새 UI·상태관리 라이브러리를 추가하지 않는다.
- 모든 사용자 노출 문구는 한국어로 작성한다.
- 모바일 360px 이상과 PC 화면을 모두 지원하고 터치 대상은 최소 44px로 한다.
- 공개 API에는 쿠폰, 메모, 관리자 상태를 포함하지 않는다.
- 쿠폰 잔액은 `coupon_events.delta` 합계로 계산하고 배정/취소 트랜잭션 정책을 유지한다.
- 같은 학생의 같은 시간대 중복 배정과 0 이하 쿠폰 학생 배정을 계속 허용한다.
- 로고는 `public/brand/bhs-ski-academy-logo.png`에 저장하고 `next/image`에서 고정 width/height로 사용한다.
- 각 작업은 테스트 또는 빌드 가능한 독립 결과와 커밋으로 끝낸다.

---

### Task 1: 브랜드 자산과 전역 디자인 시스템

**Files:**
- Create: `public/brand/bhs-ski-academy-logo.png`
- Create: `components/brand/BrandLogo.tsx`
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Modify: `app/favicon.ico`
- Test: `tests/brand.test.ts`

**Interfaces:**
- Produces: `BrandLogo({ compact?: boolean, inverse?: boolean, priority?: boolean }): JSX.Element`
- Produces: Tailwind 토큰 `alpine`, `summit`, `ice`, `sky`, `slate`, `success`, `danger`

- [ ] **Step 1: 원본 로고의 크기와 형식을 검사한다**

Run: `sips -g pixelWidth -g pixelHeight -g format '/Users/gimhyeongseog/Desktop/배호성 동그라미 로고.PNG'`

Expected: PNG이며 가로 723px, 세로 724px로 출력된다.

- [ ] **Step 2: 실패하는 브랜드 자산 테스트를 작성한다**

```ts
import { describe, expect, it } from "vitest";
import { existsSync, statSync } from "node:fs";

describe("공식 로고", () => {
  it("공개 브랜드 자산으로 존재한다", () => {
    const path = "public/brand/bhs-ski-academy-logo.png";
    expect(existsSync(path)).toBe(true);
    expect(statSync(path).size).toBeGreaterThan(10_000);
  });
});
```

- [ ] **Step 3: 테스트가 실패하는지 확인한다**

Run: `npm test -- tests/brand.test.ts`

Expected: 로고 파일이 없어 FAIL.

- [ ] **Step 4: 원본 로고를 공개 자산 경로에 보존하고 BrandLogo를 구현한다**

```tsx
import Image from "next/image";

export default function BrandLogo({ compact = false, inverse = false, priority = false }) {
  return (
    <div className="flex items-center gap-3">
      <Image src="/brand/bhs-ski-academy-logo.png" width={compact ? 48 : 72} height={compact ? 48 : 72} alt="배호성 스키 아카데미 로고" priority={priority} className="rounded-full bg-white" />
      <div className={inverse ? "text-white" : "text-alpine"}>
        <strong className="block">배호성 스키 아카데미</strong>
        <span className="text-[10px] tracking-[0.16em] opacity-60">BAE HO SUNG SKI ACADEMY</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 전역 색상·표면·포커스·기본 타이포그래피를 정의하고 metadata를 보강한다**

`app/globals.css`의 기존 토큰을 프리미엄 알파인 팔레트로 교체하고 `body` 배경, `::selection`, `:focus-visible`을 정의한다. `app/layout.tsx`의 제목을 `배호성 스키 아카데미 | 반편성 안내`로 변경한다.

- [ ] **Step 6: 테스트, 린트, 빌드를 실행한다**

Run: `npm test -- tests/brand.test.ts && npm run lint && npm run build`

Expected: 모두 PASS.

- [ ] **Step 7: 커밋한다**

```bash
git add public/brand components/brand app/globals.css app/layout.tsx app/favicon.ico tests/brand.test.ts
git commit -m "feat: 공식 로고와 알파인 디자인 시스템 적용"
```

---

### Task 2: 공통 상태·피드백 컴포넌트

**Files:**
- Create: `components/ui/StatusPanel.tsx`
- Create: `components/ui/Toast.tsx`
- Create: `components/ui/Modal.tsx`
- Create: `components/ui/Spinner.tsx`
- Create: `lib/http.ts`
- Test: `tests/http.test.ts`

**Interfaces:**
- Produces: `requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T>`
- Produces: `StatusPanel`, `Toast`, `Modal`, `Spinner`

- [ ] **Step 1: HTTP 오류 메시지 테스트를 작성한다**

```ts
it("서버 JSON 오류 메시지를 보존한다", async () => {
  global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "선생님을 선택해주세요" }), { status: 400 }));
  await expect(requestJson("/test")).rejects.toThrow("선생님을 선택해주세요");
});
```

- [ ] **Step 2: 테스트 실패를 확인한다**

Run: `npm test -- tests/http.test.ts`

Expected: `requestJson` 모듈이 없어 FAIL.

- [ ] **Step 3: `requestJson`과 접근 가능한 상태 컴포넌트를 구현한다**

`requestJson`은 `res.ok`가 아니면 JSON의 `error` 또는 `요청 처리에 실패했습니다`를 throw한다. `Modal`은 `role="dialog"`, `aria-modal="true"`, 제목 연결, Escape 닫기를 제공한다. `Toast`는 `role="status"`, 오류일 때 `role="alert"`를 사용한다.

- [ ] **Step 4: 테스트와 린트를 실행한다**

Run: `npm test -- tests/http.test.ts && npm run lint`

Expected: PASS.

- [ ] **Step 5: 커밋한다**

```bash
git add components/ui lib/http.ts tests/http.test.ts
git commit -m "feat: 공통 로딩 오류 모달 피드백 구성"
```

---

### Task 3: 학부모 반편성 화면 전면 개편

**Files:**
- Modify: `components/ScheduleView.tsx`
- Create: `components/schedule/ScheduleSection.tsx`
- Create: `components/schedule/ClassCard.tsx`
- Create: `components/schedule/ScheduleHeader.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `BrandLogo`, `StatusPanel`, `Spinner`, `requestJson`
- Produces: 기존 `ScheduleView({ today, tomorrow })` 공개 인터페이스 유지

- [ ] **Step 1: `ScheduleView`를 헤더·날짜 선택·상태·섹션으로 분해한다**

상태는 `{ data, selectedDate, isInitialLoading, isRefreshing, error, updatedAt }`로 명시한다. 날짜 전환 때 이전 날짜 데이터는 표시하지 않고, 같은 날짜의 폴링 갱신 중에는 기존 데이터를 유지한다.

- [ ] **Step 2: 프리미엄 알파인 학부모 화면을 구현한다**

상단 네이비 브랜드 영역, 선택 날짜, 오늘/내일 세그먼트, 오전/오후 섹션, 학생 수와 명단, 마지막 갱신 시각, 수동 새로고침을 구현한다. 학생 이름은 모바일에서 최소 17px로 유지한다.

- [ ] **Step 3: 접근성과 상태 문구를 확인한다**

날짜 탭에 `aria-pressed`, 새로고침에 접근 가능한 이름, 로딩에 `aria-live="polite"`를 적용한다. 오류 시 기존 데이터가 있으면 상단 경고만, 없으면 전체 오류 패널을 표시한다.

- [ ] **Step 4: 전체 테스트·린트·빌드를 실행한다**

Run: `npm test && npm run lint && npm run build`

Expected: 모두 PASS.

- [ ] **Step 5: 커밋한다**

```bash
git add app/page.tsx components/ScheduleView.tsx components/schedule
git commit -m "feat: 학부모 반편성 화면 전면 개편"
```

---

### Task 4: 관리자 셸과 로그인 화면

**Files:**
- Modify: `components/admin/AdminDashboard.tsx`
- Modify: `components/admin/LoginForm.tsx`
- Create: `components/admin/AdminShell.tsx`
- Create: `components/admin/AdminNavigation.tsx`

**Interfaces:**
- Produces: `AdminShell({ activeTab, onTabChange, children })`
- Consumes: 기존 `ClassBoard`, `StudentManager`, `TeacherManager`

- [ ] **Step 1: 모바일 하단 탐색과 PC 사이드바를 같은 탭 상태에 연결한다**

`AdminNavigation`은 `반편성`, `아이·쿠폰`, `선생님`의 세 메뉴를 렌더링한다. 768px 미만은 하단 고정, 이상은 좌측 사이드바로 표시한다.

- [ ] **Step 2: 관리자 로그인 화면을 공식 로고 중심의 전용 화면으로 개편한다**

비밀번호 레이블, 제출 중 비활성화, 서버/네트워크 오류 구분, 44px 입력·버튼, `autocomplete="current-password"`를 적용한다.

- [ ] **Step 3: 관리자 페이지의 최대 폭·여백·브랜드 헤더를 통일한다**

모바일 콘텐츠가 하단 탐색에 가리지 않도록 안전 여백을 주고, PC 콘텐츠는 최대 1440px 안에서 확장한다.

- [ ] **Step 4: 린트와 빌드를 실행한다**

Run: `npm run lint && npm run build`

Expected: PASS.

- [ ] **Step 5: 커밋한다**

```bash
git add components/admin/AdminDashboard.tsx components/admin/LoginForm.tsx components/admin/AdminShell.tsx components/admin/AdminNavigation.tsx
git commit -m "feat: 반응형 관리자 셸과 로그인 개편"
```

---

### Task 5: 반 담당 선생님 변경 API

**Files:**
- Modify: `app/api/admin/classes/[id]/route.ts`
- Create: `lib/classes.ts`
- Test: `tests/classes.test.ts`

**Interfaces:**
- Produces: `updateClassTeacher(classId: string, teacherId: string): Promise<Class>`
- Produces: `PATCH /api/admin/classes/:id` body `{ teacherId: string }`

- [ ] **Step 1: 실패하는 서비스 테스트를 작성한다**

```ts
it("반의 담당 선생님을 변경한다", async () => {
  const klass = await prisma.class.create({ data: { date: "2026-08-26", slot: "AM", teacherId: first.id } });
  const updated = await updateClassTeacher(klass.id, second.id);
  expect(updated.teacherId).toBe(second.id);
});
```

- [ ] **Step 2: 테스트 실패를 확인한다**

Run: `npm test -- tests/classes.test.ts`

Expected: `updateClassTeacher`가 없어 FAIL.

- [ ] **Step 3: 서비스와 PATCH Route Handler를 구현한다**

`teacherId`가 비어 있으면 400, 선생님 또는 반이 없으면 404를 반환한다. Next.js 16 규칙에 맞춰 동적 route의 `params`는 Promise로 await한다.

- [ ] **Step 4: DB 테스트와 전체 테스트를 실행한다**

Run: `npm test -- tests/classes.test.ts && npm test`

Expected: PASS.

- [ ] **Step 5: 커밋한다**

```bash
git add app/api/admin/classes/[id]/route.ts lib/classes.ts tests/classes.test.ts
git commit -m "feat: 반 담당 선생님 변경 API"
```

---

### Task 6: 반편성 운영 화면 개편

**Files:**
- Modify: `components/admin/ClassBoard.tsx`
- Create: `components/admin/classes/ClassCard.tsx`
- Create: `components/admin/classes/CreateClassModal.tsx`
- Create: `components/admin/classes/StudentPicker.tsx`
- Create: `components/admin/classes/EditClassModal.tsx`

**Interfaces:**
- Consumes: `PATCH /api/admin/classes/:id`, 기존 생성·배정·취소·삭제 API
- Produces: 모바일 단일 시간대/PC 오전·오후 동시 보기

- [ ] **Step 1: 데이터 로딩과 mutation을 `requestJson` 기반으로 통일한다**

각 mutation은 해당 버튼의 처리 상태를 저장하고 완료 후 `classes`와 `students`를 함께 갱신한다. 실패 시 성공 상태로 먼저 바꾸지 않는다.

- [ ] **Step 2: 모바일·PC 반편성 레이아웃을 구현한다**

모바일은 날짜와 시간대 선택 후 카드 한 열, PC는 선택 날짜 아래 오전·오후 두 열을 렌더링한다. 날짜, 시간대, 반, 선생님, 학생의 시각 위계를 유지한다.

- [ ] **Step 3: 생성·편집·삭제 흐름을 전용 모달로 교체한다**

반 생성은 시간대/선생님, 반 편집은 선생님 변경, 삭제 확인은 학생 수와 쿠폰 복구 문구를 표시한다.

- [ ] **Step 4: 검색 가능한 학생 배정 패널을 구현한다**

학생 이름과 메모로 필터링하고 잔여 쿠폰을 표시한다. 0 이하 잔액은 `쿠폰 부족 · 배정 가능`이라는 텍스트 경고를 함께 보여준다.

- [ ] **Step 5: 린트·빌드·전체 테스트를 실행한다**

Run: `npm test && npm run lint && npm run build`

Expected: PASS.

- [ ] **Step 6: 커밋한다**

```bash
git add components/admin/ClassBoard.tsx components/admin/classes
git commit -m "feat: 모바일 PC 반편성 운영 화면 개편"
```

---

### Task 7: 쿠폰 이벤트 이력 API

**Files:**
- Create: `app/api/admin/students/[id]/coupons/history/route.ts`
- Modify: `lib/coupons.ts`
- Modify: `tests/coupons.test.ts`

**Interfaces:**
- Produces: `couponHistory(studentId: string): Promise<Array<{ id: string; delta: number; reason: string; createdAt: Date }>>`
- Produces: `GET /api/admin/students/:id/coupons/history`

- [ ] **Step 1: 최신순 이력 테스트를 작성한다**

```ts
it("쿠폰 이력을 최신순으로 반환한다", async () => {
  const history = await couponHistory(student.id);
  expect(history.map((event) => event.reason)).toEqual(["최근 충전", "최초 충전"]);
});
```

- [ ] **Step 2: 테스트 실패를 확인한다**

Run: `npm test -- tests/coupons.test.ts`

Expected: `couponHistory`가 없어 FAIL.

- [ ] **Step 3: 서비스와 인증된 GET Route Handler를 구현한다**

`createdAt: "desc"`로 조회하고 학생이 없으면 404를 반환한다. 관리자 인증은 기존 `requireAdmin()`을 사용한다.

- [ ] **Step 4: 테스트를 실행한다**

Run: `npm test -- tests/coupons.test.ts && npm test`

Expected: PASS.

- [ ] **Step 5: 커밋한다**

```bash
git add app/api/admin/students/[id]/coupons/history/route.ts lib/coupons.ts tests/coupons.test.ts
git commit -m "feat: 학생 쿠폰 이력 조회 API"
```

---

### Task 8: 아이·쿠폰 관리 화면 개편

**Files:**
- Modify: `components/admin/StudentManager.tsx`
- Create: `components/admin/students/StudentForm.tsx`
- Create: `components/admin/students/CouponChargeModal.tsx`
- Create: `components/admin/students/CouponHistoryModal.tsx`

**Interfaces:**
- Consumes: 학생 목록/등록 API, 쿠폰 충전 API, 쿠폰 이력 API
- Produces: 검색·잔액 필터·전용 충전 폼·이력 화면

- [ ] **Step 1: 학생 검색과 잔액 필터 상태를 구현한다**

필터는 `전체`, `쿠폰 있음`, `쿠폰 부족`으로 제공하고 이름·메모 검색과 함께 적용한다. 결과 수를 상단에 표시한다.

- [ ] **Step 2: 등록 폼과 반응형 목록을 개편한다**

모바일은 카드 목록, PC는 정렬된 행 형태로 이름·메모·잔액·동작을 표시한다. 빈 검색 결과와 전체 빈 상태를 구분한다.

- [ ] **Step 3: 기본 prompt를 쿠폰 충전 모달로 교체한다**

정수 횟수, 학생 이름, 충전 후 예상 잔액을 보여주고 처리 중 중복 제출을 막는다.

- [ ] **Step 4: 쿠폰 이력 모달을 구현한다**

최신순으로 날짜, 사유, 증감량을 표시하고 충전 `+`, 배정 차감 `-`, 취소 복구 `+`를 텍스트와 색으로 함께 구분한다.

- [ ] **Step 5: 전체 검증을 실행한다**

Run: `npm test && npm run lint && npm run build`

Expected: PASS.

- [ ] **Step 6: 커밋한다**

```bash
git add components/admin/StudentManager.tsx components/admin/students
git commit -m "feat: 아이와 쿠폰 관리 화면 개편"
```

---

### Task 9: 선생님 관리 화면 개편

**Files:**
- Modify: `components/admin/TeacherManager.tsx`

**Interfaces:**
- Consumes: 기존 선생님 목록·등록·비활성화 API
- Produces: 반응형 선생님 관리 목록과 통일된 피드백

- [ ] **Step 1: 등록·목록·빈 상태를 디자인 시스템에 맞게 개편한다**

입력 레이블, 제출 중 상태, 성공·실패 토스트를 적용하고 모바일 카드/PC 행 레이아웃을 제공한다.

- [ ] **Step 2: 제외 확인을 공통 Modal로 교체한다**

`목록에서 제외`가 기존 반 데이터를 삭제하지 않는다는 문구를 명시한다.

- [ ] **Step 3: 린트와 빌드를 실행한다**

Run: `npm run lint && npm run build`

Expected: PASS.

- [ ] **Step 4: 커밋한다**

```bash
git add components/admin/TeacherManager.tsx
git commit -m "feat: 선생님 관리 화면 개편"
```

---

### Task 10: 전체 흐름과 반응형 시각 검증

**Files:**
- Modify: `README.md`
- Modify: implementation files only when verification reveals an in-scope defect

**Interfaces:**
- Verifies: public schedule, admin login, class lifecycle, coupon lifecycle, responsive layouts

- [ ] **Step 1: 자동 검증을 깨끗한 상태에서 실행한다**

Run: `npm test && npm run lint && npm run build`

Expected: 모든 테스트 PASS, ESLint 오류 0, production build 성공.

- [ ] **Step 2: 모바일 뷰포트에서 주요 화면을 확인한다**

360×800과 390×844에서 `/`, `/admin` 로그인, 반편성, 아이·쿠폰, 선생님 화면을 확인한다. 가로 스크롤, 잘린 버튼, 44px 미만 터치 대상이 없어야 한다.

- [ ] **Step 3: PC 뷰포트에서 주요 화면을 확인한다**

1440×900에서 관리자 사이드바, 오전·오후 두 열, 관리 목록의 정렬과 빈 공간을 확인한다.

- [ ] **Step 4: 실제 데이터 전체 흐름을 확인한다**

반 생성 → 선생님 변경 → 학생 배정 → 쿠폰 -1 → 배정 취소 → 쿠폰 +1 복구 → 반 삭제 순서로 확인한다. 학부모 화면에는 쿠폰과 메모가 없어야 한다.

- [ ] **Step 5: 운영 문서를 갱신한다**

README에 공식 로고 자산 위치, 모바일/PC 관리자 메뉴, 쿠폰 이력, 새 반 편집 흐름을 기록한다.

- [ ] **Step 6: 최종 검증 커밋을 만든다**

```bash
git add README.md
git commit -m "docs: 전면 개편 운영 흐름 갱신"
```
