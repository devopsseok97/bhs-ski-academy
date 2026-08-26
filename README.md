# BHS 스키아카데미 반편성 사이트

- 학부모 페이지: `/` (링크 공유용, 로그인 없음)
- 관리자 페이지: `/admin` (ADMIN_PASSWORD로 로그인)

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
