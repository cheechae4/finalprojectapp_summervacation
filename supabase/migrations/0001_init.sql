-- 모임픽 초기 스키마
-- Supabase 대시보드 > SQL Editor 에 그대로 붙여넣고 실행하면 됩니다.

create extension if not exists "pgcrypto";

-- 모임
create table if not exists meetings (
  id uuid primary key default gen_random_uuid(),
  creator_token uuid not null,
  title text not null,
  purpose text not null check (purpose in ('study', 'meeting', 'meal', 'social')),
  min_duration_minutes int not null check (min_duration_minutes > 0),
  status text not null default 'voting' check (status in ('voting', 'confirmed')),
  confirmed_candidate_id uuid,
  confirmed_location text,
  created_at timestamptz not null default now()
);

-- 시간 후보
create table if not exists time_candidates (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  check (end_at > start_at)
);

-- 참가자
create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  participant_token uuid not null,
  name text not null,
  departure_location text,
  created_at timestamptz not null default now(),
  unique (meeting_id, participant_token)
);

-- 시간 투표
create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  candidate_id uuid not null references time_candidates(id) on delete cascade,
  status text not null check (status in ('unavailable', 'available', 'preferred')),
  comment text,
  created_at timestamptz not null default now(),
  unique (participant_id, candidate_id)
);

-- 준비물 체크리스트
create table if not exists checklist_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  content text not null,
  assignee_participant_id uuid references participants(id) on delete set null,
  is_done boolean not null default false,
  created_at timestamptz not null default now()
);

-- 반복 모임 선호 학습용 (P2)
create table if not exists group_preferences (
  id uuid primary key default gen_random_uuid(),
  participant_group_hash text not null,
  preferred_weekday int,
  preferred_time_range text,
  preferred_location_category text,
  updated_at timestamptz not null default now()
);

alter table meetings add column if not exists confirmed_candidate_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'meetings_confirmed_candidate_fk'
  ) then
    alter table meetings
      add constraint meetings_confirmed_candidate_fk
      foreign key (confirmed_candidate_id)
      references time_candidates(id) on delete set null;
  end if;
end $$;

create index if not exists idx_time_candidates_meeting on time_candidates(meeting_id);
create index if not exists idx_participants_meeting on participants(meeting_id);
create index if not exists idx_votes_candidate on votes(candidate_id);
create index if not exists idx_votes_participant on votes(participant_id);
create index if not exists idx_checklist_meeting on checklist_items(meeting_id);

-- ── 접근 정책 ────────────────────────────────────────────────
-- 로그인이 없는 서비스라서, 링크(모임 UUID)를 아는 사람이 곧 참여자입니다.
-- 수정 권한은 앱에서 creator_token / participant_token 으로 확인합니다.

alter table meetings enable row level security;
alter table time_candidates enable row level security;
alter table participants enable row level security;
alter table votes enable row level security;
alter table checklist_items enable row level security;
alter table group_preferences enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'meetings', 'time_candidates', 'participants',
    'votes', 'checklist_items', 'group_preferences'
  ] loop
    execute format('drop policy if exists "link_access" on %I', t);
    execute format(
      'create policy "link_access" on %I for all to anon, authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;
