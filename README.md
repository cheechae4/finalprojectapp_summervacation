# 모임픽

모임 목적과 참석자 일정을 같이 보고 언제 만날지 정해주는 서비스입니다. 로그인 없이 링크만 공유하면 됩니다.

## 어떻게 동작하나요

1. 모임을 만들면 `meeting_id`가 들어간 공유 링크가 나옵니다.
2. 링크를 받은 사람은 이름과 출발지를 적고, 후보 시간마다 안 됨 / 가능 / 선호를 고릅니다.
3. 결과 화면에서 목적별 가중치로 계산한 추천 시간과 그 이유를 보여줍니다.
4. 장소와 준비물을 정리하고, 마지막에 한 페이지로 확정합니다.

로그인이 없어서 브라우저 로컬스토리지에 토큰을 둡니다. 모임을 만든 사람은 `creator_token`, 참가자는 모임별 `participant_token`으로 자기 것을 식별합니다.

## 기술 스택

- Next.js (App Router) + Tailwind CSS
- Supabase (Postgres)
- Claude API — 추천 이유 문장 생성 (없어도 동작합니다)
- Vercel 배포

## 로컬에서 실행하기

```bash
npm install
cp .env.example .env.local   # 값 채우기
npm run dev
```

`.env.local`에 넣을 값:

| 키 | 필수 | 설명 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 예 | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 예 | Supabase anon public key |
| `ANTHROPIC_API_KEY` | 아니오 | 없으면 규칙 기반 문장으로 대체됩니다 |

## Supabase 준비

1. [supabase.com](https://supabase.com)에서 프로젝트를 만듭니다.
2. 대시보드 왼쪽 **SQL Editor**를 열고 [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) 내용을 붙여넣어 실행합니다.
3. **Settings > API**에서 Project URL과 anon public key를 복사해 환경변수에 넣습니다.

### 접근 정책에 대해

로그인이 없는 서비스라 RLS 정책은 "링크(UUID)를 아는 사람이 곧 참여자"라는 전제로 열려 있습니다. 즉 anon key를 가진 쪽에서는 모임 목록을 훑을 수 있습니다. 수업 과제 범위에서는 충분하지만, 실제 서비스로 키우려면 모임 조회에 별도 토큰을 요구하거나 서버 라우트를 거치도록 바꿔야 합니다.

## Vercel 배포

1. GitHub 저장소를 Vercel에 import 합니다.
2. Environment Variables에 위 세 개를 넣습니다. `NEXT_PUBLIC_`으로 시작하는 두 개는 브라우저에도 노출되는 값이고, `ANTHROPIC_API_KEY`는 서버에서만 씁니다.
3. Deploy 하면 끝입니다. 별도 빌드 설정은 필요 없습니다.

## 추천 로직

`lib/recommendation.ts`에 있습니다.

- 하드 필터: 후보 길이가 최소 필요 시간보다 짧거나, 아무도 못 오는 후보는 제외
- 기본 점수: `선호 인원 × 가중치 + 가능 인원`
- 목적별 차이
  - 스터디 / 회의: 시간 확보를 먼저 보고, 동점이면 후보가 긴 쪽
  - 식사: 선호 가중치를 3으로 올려서 "가고 싶은 사람" 수를 크게 봄
  - 친목: 점수보다 참석 가능 인원 수를 먼저 봄

## 폴더 구조

```
app/
  page.tsx                     랜딩
  create/                      모임 만들기, 생성 완료
  e/[meetingId]/               투표 · 결과 · 장소 · 준비물 · 확정
  api/reason/route.ts          Claude 호출 (서버 전용)
components/                    화면 조각
lib/                           supabase · claude · 추천 로직 · 토큰 · 포맷
supabase/migrations/           DB 스키마
```
