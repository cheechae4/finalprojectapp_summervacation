-- 위치 좌표 추가
-- 0001_init.sql 을 이미 실행한 프로젝트에 이어서 실행하면 됩니다.

-- 참가자 출발지 좌표. 브라우저 위치 권한이나 장소 검색으로 채운다.
alter table participants
  add column if not exists departure_lat double precision,
  add column if not exists departure_lng double precision;

-- 확정된 장소의 좌표
alter table meetings
  add column if not exists confirmed_place_lat double precision,
  add column if not exists confirmed_place_lng double precision;
