"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PURPOSE_LABEL, type ChecklistItem, type Purpose } from "@/lib/types";
import { useMeeting } from "@/lib/useMeeting";

const TEMPLATES: Record<Purpose, string[]> = {
  study: [
    "오늘 볼 범위 정하기",
    "자리 예약하기",
    "노트북과 충전기 챙기기",
    "간식 사 오기",
  ],
  meeting: [
    "안건 정리해서 미리 공유하기",
    "회의록 쓸 사람 정하기",
    "발표 자료 준비하기",
    "회의실 예약하기",
  ],
  meal: [
    "식당 예약하기",
    "못 먹는 음식 확인하기",
    "인원 최종 확인하기",
    "정산 방법 정하기",
  ],
  social: [
    "장소 예약하기",
    "회비 정하기",
    "준비물 사 오기",
    "사진 찍을 사람 정하기",
  ],
};

export default function ChecklistPage() {
  const meetingId = useParams<{ meetingId: string }>().meetingId;
  const { data, error, loading } = useMeeting(meetingId);

  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const fetchItems = useCallback(async () => {
    if (!meetingId) return [] as ChecklistItem[];
    const { data: rows } = await supabase
      .from("checklist_items")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("created_at");
    return (rows ?? []) as ChecklistItem[];
  }, [meetingId]);

  useEffect(() => {
    let active = true;
    void fetchItems().then((rows) => {
      if (active) setItems(rows);
    });
    return () => {
      active = false;
    };
  }, [fetchItems]);

  async function fillTemplate() {
    if (!data) return;
    setBusy(true);
    await supabase.from("checklist_items").insert(
      TEMPLATES[data.meeting.purpose].map((content) => ({
        meeting_id: data.meeting.id,
        content,
      })),
    );
    setItems(await fetchItems());
    setBusy(false);
  }

  async function addItem() {
    if (!data || !draft.trim()) return;
    setBusy(true);
    await supabase.from("checklist_items").insert({
      meeting_id: data.meeting.id,
      content: draft.trim(),
    });
    setDraft("");
    setItems(await fetchItems());
    setBusy(false);
  }

  async function toggle(item: ChecklistItem) {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_done: !i.is_done } : i)),
    );
    await supabase
      .from("checklist_items")
      .update({ is_done: !item.is_done })
      .eq("id", item.id);
  }

  async function assign(item: ChecklistItem, participantId: string) {
    const value = participantId || null;
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, assignee_participant_id: value } : i,
      ),
    );
    await supabase
      .from("checklist_items")
      .update({ assignee_participant_id: value })
      .eq("id", item.id);
  }

  async function remove(item: ChecklistItem) {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    await supabase.from("checklist_items").delete().eq("id", item.id);
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

  const { meeting, participants } = data;

  return (
    <div className="pt-2">
      <h1 className="text-[22px] font-bold tracking-tight">준비물</h1>
      <p className="mt-1 text-[13.5px] text-ink-soft">
        {meeting.title} · {PURPOSE_LABEL[meeting.purpose]}
      </p>

      {items.length === 0 ? (
        <div className="card mt-6 p-5">
          <p className="text-[14px] leading-relaxed text-ink-soft">
            {PURPOSE_LABEL[meeting.purpose]} 모임에서 보통 챙기는 것들을 넣어
            드릴까요? 넣은 뒤에 고치거나 지울 수 있어요.
          </p>
          <button
            type="button"
            onClick={fillTemplate}
            disabled={busy}
            className="btn-primary mt-4 w-full"
          >
            기본 목록 넣기
          </button>
        </div>
      ) : (
        <ul className="mt-6 space-y-2.5">
          {items.map((item) => (
            <li key={item.id} className="card p-3.5">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={item.is_done}
                  onChange={() => toggle(item)}
                  className="mt-1 size-4 accent-[#3c8361]"
                />
                <span
                  className={`flex-1 text-[14.5px] leading-snug ${
                    item.is_done ? "text-ink-soft line-through" : ""
                  }`}
                >
                  {item.content}
                </span>
                <button
                  type="button"
                  onClick={() => remove(item)}
                  className="shrink-0 text-[13px] text-ink-soft hover:text-coral"
                >
                  지우기
                </button>
              </div>
              <select
                className="field mt-2.5 text-[13.5px]"
                value={item.assignee_participant_id ?? ""}
                onChange={(e) => assign(item, e.target.value)}
              >
                <option value="">담당자 없음</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex gap-2">
        <input
          className="field"
          value={draft}
          maxLength={60}
          placeholder="직접 추가하기"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void addItem();
          }}
        />
        <button
          type="button"
          onClick={addItem}
          disabled={busy || !draft.trim()}
          className="btn-primary shrink-0"
        >
          추가
        </button>
      </div>

      <div className="mt-8 space-y-2.5">
        <Link href={`/e/${meeting.id}/result`} className="btn-ghost w-full">
          시간 결과로 돌아가기
        </Link>
        <Link href={`/e/${meeting.id}/confirm`} className="btn-ghost w-full">
          최종 정리 보기
        </Link>
      </div>
    </div>
  );
}
