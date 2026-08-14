"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PURPOSE_LABEL, type Purpose } from "@/lib/types";
import { useCreatorToken } from "@/lib/useClientValue";
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

  // 입력을 건드리기 전까지는 저장된 값을 그대로 보여준다.
  const [placeEdit, setPlaceEdit] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const creatorToken = useCreatorToken();
  const isCreator = Boolean(
    data && creatorToken && creatorToken === data.meeting.creator_token,
  );
  const place = placeEdit ?? data?.meeting.confirmed_location ?? "";

  const departures = useMemo(() => {
    if (!data) return [];
    const counts = new Map<string, number>();
    for (const p of data.participants) {
      const loc = p.departure_location?.trim();
      if (!loc) continue;
      counts.set(loc, (counts.get(loc) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  async function save() {
    if (!data) return;
    setSaving(true);
    await supabase
      .from("meetings")
      .update({ confirmed_location: place.trim() || null })
      .eq("id", data.meeting.id);
    setSaving(false);
    setSaved(true);
    void reload();
  }

  if (loading) {
    return <p className="pt-8 text-[14px] text-ink-soft">불러오는 중</p>;
  }
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

      <section className="mt-6">
        <h2 className="text-[16px] font-semibold">다들 어디서 출발하나요</h2>
        {departures.length === 0 ? (
          <p className="card mt-2.5 p-4 text-[14px] text-ink-soft">
            아직 출발지를 적은 사람이 없어요. 투표할 때 같이 적어주시면 여기
            모여요.
          </p>
        ) : (
          <ul className="mt-2.5 space-y-2">
            {departures.map((d) => (
              <li
                key={d.location}
                className="card flex items-center justify-between p-3.5"
              >
                <span className="text-[14.5px]">{d.location}</span>
                <span className="text-[13px] text-ink-soft">{d.count}명</span>
              </li>
            ))}
          </ul>
        )}
        {departures.length > 1 && (
          <p className="mt-2.5 text-[13px] leading-relaxed text-ink-soft">
            가장 많은 사람이 {departures[0].location}에서 출발해요. 그 근처로
            잡으면 이동이 제일 적어요.
          </p>
        )}
      </section>

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
              className="rounded-full border border-sand bg-white px-3.5 py-1.5 text-[13.5px] transition hover:border-green"
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <h2 className="text-[16px] font-semibold">만날 곳</h2>
        <input
          className="field mt-2.5"
          value={place}
          maxLength={60}
          placeholder="예: 혜화역 근처 스터디카페"
          onChange={(e) => {
            setPlaceEdit(e.target.value);
            setSaved(false);
          }}
          disabled={!isCreator}
        />
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
