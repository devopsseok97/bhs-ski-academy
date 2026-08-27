# BHS 스키아카데미 반편성 사이트

- 학부모 페이지: `/` (링크 공유용, 로그인 없음)
- 관리자 페이지: `/admin` (ADMIN_PASSWORD로 로그인)

## 화면 구조

- 학부모 화면: 상단 브랜드 헤더 → 오늘/내일 세그먼트 → 오전(연한 파랑)·오후(진한 파랑) 반과 학생 명단. 이름은 최소 17px, 30초마다 자동 갱신.
- 관리자 화면: 상단 알파인 헤더 + 좌측 사이드바(PC) / 하단 탐색(모바일)로 `반편성`, `아이·쿠폰`, `선생님` 3개 메뉴 이동.
  - 반편성: 날짜별 오전·오후 반. 반 만들기·선생님 변경·삭제·학생 배정·배정 취소를 모달로 처리하고 성공/실패 토스트로 안내.
  - 아이·쿠폰: 학생 검색, 잔액 필터(전체/쿠폰 있음/쿠폰 부족), 쿠폰 조정 모달(예상 잔액 미리보기), 쿠폰 이력 모달(최신순, 부호별 색상).
  - 선생님: 등록·목록·목록에서 제외. 제외해도 기존 반편성 기록은 유지된다는 안내를 모달에 표시.

## 브랜드 자산

- 공식 로고: `public/brand/bhs-ski-academy-logo.png` (`components/brand/BrandLogo.tsx`를 통해서만 사용).
- 색상 토큰: `app/globals.css`의 `--color-alpine`, `--color-summit`, `--color-sky`, `--color-ice`, `--color-danger`, `--color-success` 등을 Tailwind로 노출.

## 주요 API

- `GET /api/schedule?date=YYYY-MM-DD` – 학부모용, 쿠폰·메모·관리자 상태 제외.
- `POST /api/admin/classes` / `PATCH /api/admin/classes/:id` / `DELETE /api/admin/classes/:id`
- `POST /api/admin/classes/:id/students` / `DELETE /api/admin/assignments/:id`
- `GET|POST|PATCH /api/admin/students`, `POST /api/admin/students/:id/coupons`, `GET /api/admin/students/:id/coupons/history`
- `GET|POST /api/admin/teachers`, `DELETE /api/admin/teachers/:id`

배정/취소/반 삭제는 트랜잭션으로 쿠폰이 자동 차감·복구되고, 같은 학생의 같은 시간대 중복 배정과 잔액 0 이하 배정은 계속 허용됩니다.

## 로컬 개발

1. **Postgres 준비** (다음 중 하나)
   - `docker compose up -d` (Docker 사용)
   - 또는 `postgresql@16` 등을 로컬에서 실행 중이면 그대로 사용

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

```bash
docker compose up -d
npm test
```

Vitest는 DB 테스트 간 TRUNCATE 레이스를 피하기 위해 파일 단위 병렬 실행을 끕니다 (`vitest.config.ts`의 `fileParallelism: false`).

## 배포 전 확인

- `npm test && npm run lint && npm run build` 모두 PASS.
- 모바일 360×800과 PC 1440×900에서 `/`와 `/admin` 주요 화면 렌더 확인.
- 실제 데이터로 흐름 점검: 반 생성 → 선생님 변경 → 학생 배정(쿠폰 -1) → 배정 취소(쿠폰 +1) → 반 삭제(쿠폰 +N). 학부모 화면에는 쿠폰·메모가 노출되지 않는지 재확인.
