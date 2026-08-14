"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import Icon from "@/components/Icon";
import Loading from "@/components/Loading";
import MeetingMap, { type MapPin } from "@/components/MeetingMap";
import {
  centroid,
  estimateTravel,
  fairnessNote,
  formatKm,
  formatMinutes,
  type Point,
} from "@/lib/geo";
import { kakaoKey, searchPlace, type KakaoPlace } from "@/lib/kakao";
import { supabase } from "@/lib/supabase";
import { PURPOSE_LABEL, type Purpose } from "@/lib/types";
import { useCreatorToken, useParticipantToken } from "@/lib/useClientValue";
import { useMeeting } from "@/lib/useMeeting";

const CATEGORIES: Record<Purpose, string[]> = {
  study: ["조용한 카페", "스터디룸", "도서관", "학교 빈 강의실"],
  meeting: ["회의실", "조용한 카페", "코워킹스페이스", "학교 세미나실"],
  meal: ["밥집", "고깃집", "브런치 카페", "분식집"],
  social: ["술집", "보드게임 카페", "노래방", "공원"],
};

export default function LocationPage() {
  const meetingId = useParams<{ meetingId: string }>().meetingId;
  const { data, error, loading, reload } = useMeeting(meetingId);

  const [placeEdit, setPlaceEdit] = useState<string | null>(null);
  const [picked, setPicked] = useState<Point | null>(null);
  const [results, setResults] = useState<KakaoPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const creatorToken = useCreatorToken();
  const myToken = useParticipantToken(meetingId);

  const isCreator = Boolean(
    data && creatorToken && creatorToken === data.meeting.creator_token,
  );
  const place = placeEdit ?? data?.meeting.confirmed_location ?? "";

  /** 좌표가 있는 참가자만 지도에 올린다. */
  const pins = useMemo<MapPin[]>(() => {
    if (!data) return [];
    return data.participants
      .filter((p) => p.departure_lat !== null && p.departure_lng !== null)
      .map((p) => ({
        lat: p.departure_lat as number,
        lng: p.departure_lng as number,
        label: p.name,
        isMe: Boolean(myToken && p.participant_token === myToken),
      }));
  }, [data, myToken]);

  const savedPlacePoint = useMemo<Point | null>(() => {
    if (!data) return null;
    const { confirmed_place_lat: lat, confirmed_place_lng: lng } = data.meeting;
    return lat !== null && lng !== null ? { lat, lng } : null;
  }, [data]);

  // 장소를 정했으면 그 자리를, 아직이면 참가자들의 한가운데를 기준으로 계산한다.
  const target = picked ?? savedPlacePoint ?? centroid(pins);
  const targetLabel = picked || savedPlacePoint ? place || "만날 곳" : "중간 지점";

  const travels = useMemo(() => {
    if (!target) return [];
    return pins
      .map((pin) => ({ name: pin.label, ...estimateTravel(pin, target) }))
      .sort((a, b) => b.minutes - a.minutes);
  }, [pins, target]);

  const note = fairnessNote(travels.map((t) => t.minutes));

  const textOnly = useMemo(() => {
    if (!data) return [];
    const counts = new Map<string, number>();
    for (const p of data.participants) {
      if (p.departure_lat !== null) continue;
      const loc = p.departure_location?.trim();
      if (!loc) continue;
      counts.set(loc, (counts.get(loc) ?? 0) + 1);
    }
    return [...counts.entries()].map(([location, count]) => ({
      location,
      count,
    }));
  }, [data]);

  async function search() {
    const keyword = place.trim();
    if (!keyword) return;
    setSearching(true);
    const found = await searchPlace(keyword);
    setSearching(false);
    setResults(found.slice(0, 5));
  }

  function pick(result: KakaoPlace) {
    setPlaceEdit(result.place_name);
    setPicked({ lat: Number(result.y), lng: Number(result.x) });
    setResults([]);
    setSaved(false);
  }

  async function save() {
    if (!data) return;
    setSaving(true);
    await supabase
      .from("meetings")
      .update({
        confirmed_location: place.trim() || null,
        confirmed_place_lat: picked?.lat ?? savedPlacePoint?.lat ?? null,
        confirmed_place_lng: picked?.lng ?? savedPlacePoint?.lng ?? null,
      })
      .eq("id", data.meeting.id);
    setSaving(false);
    setSaved(true);
    void reload();
  }

  if (loading) return <Loading />;
  if (error || !data) {
    return (
      <div className="pt-8">
        <p className="text-[15px]">{error ?? "모임을 찾지 못했어요."}</p>
        <Link href="/" className="btn-ghost mt-4 w-full">
          처음으로
        </Link>
      </div>
    );
  }

  const { meeting } = data;

  return (
    <div className="pt-2">
      <h1 className="text-[22px] font-bold tracking-tight">어디서 만날까요</h1>
      <p className="mt-1 text-[13.5px] text-ink-soft">
        {meeting.title} · {PURPOSE_LABEL[meeting.purpose]}
      </p>

      <section className="mt-5">
        <MeetingMap pins={pins} center={target} centerLabel={targetLabel} />
        {!kakaoKey() && pins.length > 0 && (
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">
            지도 키가 없어서 서로의 위치 관계만 그려 보여드려요. 카카오맵 키를
            넣으면 실제 지도로 바뀝니다.
          </p>
        )}
      </section>

      {travels.length > 0 && (
        <section className="mt-7">
          <h2 className="flex items-center gap-1.5 text-[16px] font-semibold">
            <Icon name="clock" size={17} className="text-green" />
            {targetLabel}까지 얼마나 걸릴까요
          </h2>
          <ul className="mt-2.5 space-y-2">
            {travels.map((t) => (
              <li
                key={t.name}
                className="card flex items-center justify-between p-3.5"
              >
                <span className="flex items-center gap-2 text-[14.5px]">
                  <Icon
                    name={t.mode === "walk" ? "walk" : "pin"}
                    size={15}
                    className="text-ink-soft"
                  />
                  {t.name}
                </span>
                <span className="text-[14px] font-medium">
                  약 {formatMinutes(t.minutes)}
                  <span className="ml-1.5 text-[12.5px] font-normal text-ink-soft">
                    {formatKm(t.km)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          {note && (
            <p className="mt-2.5 rounded-[14px] bg-green-soft px-3.5 py-2.5 text-[13.5px] leading-relaxed text-green-dark">
              {note}
            </p>
          )}
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">
            직선거리로 어림잡은 값이라 실제 길보다 짧게 나와요. 대중교통 기준으로
            갈아타는 시간까지 넣어 계산했습니다.
          </p>
        </section>
      )}

      {textOnly.length > 0 && (
        <section className="mt-7">
          <h2 className="text-[16px] font-semibold">글자로만 적은 출발지</h2>
          <ul className="mt-2.5 space-y-2">
            {textOnly.map((d) => (
              <li
                key={d.location}
                className="card flex items-center justify-between p-3.5"
              >
                <span className="text-[14.5px]">{d.location}</span>
                <span className="text-[13px] text-ink-soft">{d.count}명</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[12.5px] text-ink-soft">
            이분들은 위치를 안 남겨서 소요시간 계산에는 못 넣었어요.
          </p>
        </section>
      )}

      {pins.length === 0 && textOnly.length === 0 && (
        <section className="mt-7">
          <div className="card p-5 text-[14px] leading-relaxed text-ink-soft">
            아직 출발지를 남긴 사람이 없어요. 투표 화면에서 지금 있는 곳을
            눌러주시면 여기서 중간 지점을 잡아드려요.
          </div>
        </section>
      )}

      <section className="mt-7">
        <h2 className="text-[16px] font-semibold">
          {PURPOSE_LABEL[meeting.purpose]} 모임이라면
        </h2>
        <p className="mt-1 text-[13px] text-ink-soft">
          이런 곳이 잘 맞아요. 눌러서 넣고 상호명을 붙여 적어주세요.
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {CATEGORIES[meeting.purpose].map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => {
                setPlaceEdit(category);
                setSaved(false);
              }}
              className="chip-btn"
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <h2 className="flex items-center gap-1.5 text-[16px] font-semibold">
          <Icon name="pin" size={17} className="text-green" />
          만날 곳
        </h2>
        <input
          className="field mt-2.5"
          value={place}
          maxLength={60}
          placeholder="예: 혜화역 근처 스터디카페"
          onChange={(e) => {
            setPlaceEdit(e.target.value);
            setPicked(null);
            setSaved(false);
          }}
          disabled={!isCreator}
        />

        {isCreator && kakaoKey() && (
          <button
            type="button"
            onClick={search}
            disabled={searching || !place.trim()}
            className="chip-btn mt-2"
          >
            <Icon name="map" size={15} />
            {searching ? "찾는 중" : "지도에서 찾기"}
          </button>
        )}

        {results.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {results.map((result) => (
              <li key={`${result.x}-${result.y}-${result.place_name}`}>
                <button
                  type="button"
                  onClick={() => pick(result)}
                  className="w-full rounded-[14px] border border-sand bg-white px-3.5 py-2.5 text-left transition hover:border-green"
                >
                  <span className="block text-[14px] font-medium">
                    {result.place_name}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] text-ink-soft">
                    {result.road_address_name || result.address_name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {isCreator ? (
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="btn-primary mt-3 w-full"
          >
            {saving ? "저장하는 중" : saved ? "저장했어요" : "장소 저장하기"}
          </button>
        ) : (
          <p className="mt-2.5 text-[13px] text-ink-soft">
            장소는 모임을 만든 사람이 정할 수 있어요.
          </p>
        )}
      </section>

      <div className="mt-8 space-y-2.5">
        <Link href={`/e/${meeting.id}/result`} className="btn-ghost w-full">
          시간 결과로 돌아가기
        </Link>
        <Link href={`/e/${meeting.id}/checklist`} className="btn-ghost w-full">
          준비물 정리하기
        </Link>
      </div>
    </div>
  );
}
