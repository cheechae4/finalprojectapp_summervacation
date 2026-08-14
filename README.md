# 모임픽

모임 목적과 참석자 일정을 같이 보고 언제 만날지 정해주는 서비스입니다. 로그인 없이 링크만 공유하면 됩니다.

## 어떻게 동작하나요

1. 모임을 만들면 `meeting_id`가 들어간 공유 링크가 나옵니다.
2. 링크를 받은 사람은 이름과 출발지를 적고, 후보 시간마다 안 됨 / 가능 / 선호를 고릅니다. 출발지는 "지금 있는 곳" 버튼으로 좌표까지 남길 수 있습니다.
3. 결과 화면에서 목적별 가중치로 계산한 추천 시간과 그 이유를 보여줍니다.
4. 장소 화면에서 참가자 위치를 지도에 찍고, 한가운데까지 각자 얼마나 걸리는지 계산합니다.
5. 준비물을 정리하고, 마지막에 한 페이지로 확정합니다.

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
| `NEXT_PUBLIC_KAKAO_MAP_KEY` | 아니오 | 없으면 좌표만으로 그린 위치 관계도로 대체됩니다 |

## 카카오맵 키 (선택)

지도를 실제 지도로 띄우고 장소 이름으로 좌표를 찾으려면 필요합니다. 없어도 위치 관계도와 소요시간 계산은 그대로 동작합니다.

1. [developers.kakao.com](https://developers.kakao.com)에 로그인하고 애플리케이션을 하나 만듭니다.
2. **앱 키**에서 **JavaScript 키**를 복사해 `NEXT_PUBLIC_KAKAO_MAP_KEY`에 넣습니다.
3. **플랫폼 → Web**에 사이트 도메인을 등록합니다. 등록 안 하면 지도가 안 뜹니다.
   - 로컬: `http://localhost:3000`
   - 배포: `https://<프로젝트>.vercel.app`

## Supabase 준비

1. [supabase.com](https://supabase.com)에서 프로젝트를 만듭니다.
2. 대시보드 왼쪽 **SQL Editor**를 열고 마이그레이션을 순서대로 실행합니다.
   - [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) — 테이블과 접근 정책
   - [`supabase/migrations/0002_location.sql`](supabase/migrations/0002_location.sql) — 출발지·장소 좌표
3. **Settings > API**에서 Project URL과 anon public key를 복사해 환경변수에 넣습니다.

### 접근 정책에 대해

로그인이 없는 서비스라 RLS 정책은 "링크(UUID)를 아는 사람이 곧 참여자"라는 전제로 열려 있습니다. 즉 anon key를 가진 쪽에서는 모임 목록을 훑을 수 있습니다. 수업 과제 범위에서는 충분하지만, 실제 서비스로 키우려면 모임 조회에 별도 토큰을 요구하거나 서버 라우트를 거치도록 바꿔야 합니다.

## Vercel 배포

1. GitHub 저장소를 Vercel에 import 합니다. 빌드 설정은 건드릴 게 없습니다.
2. **Settings → Environment Variables**에 값을 넣습니다.

| 키 | 필수 | 어디서 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 예 | Supabase Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 예 | Supabase Settings → API |
| `NEXT_PUBLIC_KAKAO_MAP_KEY` | 아니오 | 카카오 개발자센터 JavaScript 키 |
| `NEXT_PUBLIC_GA_ID` | 아니오 | 구글 애널리틱스 측정 ID |
| `ANTHROPIC_API_KEY` | 아니오 | console.anthropic.com |

3. Deploy 합니다.

**환경변수를 추가하거나 고쳤다면 Deployments에서 Redeploy를 눌러야 반영됩니다.** 이미 배포된 결과물은 그대로 남아 있어서, 값만 저장해서는 바뀌지 않습니다. `NEXT_PUBLIC_`으로 시작하는 값은 빌드할 때 코드에 박히고, 서버에서만 쓰는 `ANTHROPIC_API_KEY`도 배포 시점에 주입되므로 둘 다 재배포가 필요합니다.

`NEXT_PUBLIC_SUPABASE_URL`에는 Supabase 대시보드의 Project URL을 그대로 넣습니다. 뒤에 `/rest/v1/`를 붙이면 안 됩니다.

Supabase 값이 없는 상태로 배포하면 화면 위에 어떤 값이 빠졌는지 알려주는 안내가 뜹니다.

카카오맵 키를 넣었다면 카카오 개발자센터의 **플랫폼 → Web**에 배포 주소(`https://<프로젝트>.vercel.app`)를 꼭 등록하세요. 등록하지 않으면 키가 있어도 지도가 뜨지 않습니다.

## 추천 로직

`lib/recommendation.ts`에 있습니다.

- 하드 필터: 후보 길이가 최소 필요 시간보다 짧거나, 아무도 못 오는 후보는 제외
- 기본 점수: `선호 인원 × 가중치 + 가능 인원`
- 목적별 차이
  - 스터디 / 회의: 시간 확보를 먼저 보고, 동점이면 후보가 긴 쪽
  - 식사: 선호 가중치를 3으로 올려서 "가고 싶은 사람" 수를 크게 봄
  - 친목: 점수보다 참석 가능 인원 수를 먼저 봄

## 구글 애널리틱스 (선택)

`NEXT_PUBLIC_GA_ID`에 측정 ID(`G-`로 시작)를 넣으면 붙습니다. 값이 없으면 스크립트 자체가 안 들어가서 아무것도 수집하지 않습니다.

[analytics.google.com](https://analytics.google.com) → 관리 → 데이터 스트림 → 웹 스트림을 만들고 측정 ID를 복사하세요.

앱 안에서 화면을 옮길 때는 페이지가 새로 열리지 않아서 조회수가 안 잡히는데, 주소가 바뀔 때마다 직접 알려주도록 해뒀습니다. 어디까지 쓰다 그만두는지 보려고 흐름의 마디마다 이벤트도 남깁니다.

| 이벤트 | 언제 | 같이 남기는 값 |
|---|---|---|
| `meeting_create` | 모임을 만들고 링크가 나왔을 때 | 목적, 후보 개수, 최소 시간 |
| `participant_join` | 이름을 적고 참여했을 때 | 위치를 남겼는지 |
| `vote_save` | 투표를 저장했을 때 | 고른 후보 수 |
| `place_save` | 장소를 저장했을 때 | 좌표까지 찍었는지 |
| `meeting_confirm` | 시간을 확정했을 때 | 어느 화면에서 눌렀는지 |

## 소요시간 계산

`lib/geo.ts`에 있습니다. 길찾기 API를 쓰지 않고 직선거리로 어림잡습니다.

- 두 지점 사이 직선거리를 구하고, 실제 길은 곧지 않으므로 1.3배를 곱합니다.
- 1.2km 미만이면 도보(시속 4.5km), 그 이상이면 대중교통(도심 실효 시속 18km + 대기·환승 8분)으로 봅니다.
- 중간 지점은 좌표를 남긴 참가자들의 평균 위치입니다. 장소를 정하고 나면 그 자리 기준으로 다시 계산합니다.

실제 경로보다 짧게 나오는 어림값이라 화면에도 그렇게 밝혀 뒀습니다. 정확한 값이 필요하면 카카오모빌리티 길찾기나 ODsay 대중교통 API를 붙이면 됩니다.

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
