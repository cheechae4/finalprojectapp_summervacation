"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PurposeSelector from "@/components/PurposeSelector";
import { toLocalInputValue } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { getCreatorToken } from "@/lib/tokens";
import type { Purpose } from "@/lib/types";

const DURATION_PRESETS = [
  { label: "30분", value: 30 },
  { label: "1시간", value: 60 },
  { label: "2시간", value: 120 },
  { label: "3시간", value: 180 },
  { label: "4시간", value: 240 },
];

interface SlotDraft {
  key: string;
  start: string;
  end: string;
}

function defaultSlot(dayOffset: number): SlotDraft {
  const start = new Date();
  start.setDate(start.getDate() + dayOffset);
  start.setHours(19, 0, 0, 0);
  const end = new Date(start);
  end.setHours(start.getHours() + 2);
  return {
    key: crypto.randomUUID(),
    start: toLocalInputValue(start),
    end: toLocalInputValue(end),
  };
}

export default function CreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState<Purpose | null>(null);
  const [duration, setDuration] = useState(120);
  const [customDuration, setCustomDuration] = useState("");
  const [slots, setSlots] = useState<SlotDraft[]>(() => [defaultSlot(1)]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minDuration = customDuration ? Number(customDuration) : duration;

  function updateSlot(key: string, patch: Partial<SlotDraft>) {
    setSlots((prev) =>
      prev.map((slot) => (slot.key === key ? { ...slot, ...patch } : slot)),
    );
  }

  function addSlot() {
    setSlots((prev) => [...prev, defaultSlot(prev.length + 1)]);
  }

  function removeSlot(key: string) {
    setSlots((prev) => prev.filter((slot) => slot.key !== key));
  }

  async function submit() {
    setError(null);

    if (!title.trim()) return setError("모임 이름을 적어주세요.");
    if (!purpose) return setError("모임 목적을 골라주세요.");
    if (!minDuration || minDuration <= 0)
      return setError("필요한 시간을 정해주세요.");
    if (slots.length === 0) return setError("시간 후보를 하나 이상 넣어주세요.");

    const parsed = slots.map((slot) => ({
      start: new Date(slot.start),
      end: new Date(slot.end),
    }));
    if (parsed.some((s) => Number.isNaN(s.start.getTime()) || Number.isNaN(s.end.getTime())))
      return setError("시간이 비어 있는 후보가 있어요.");
    if (parsed.some((s) => s.end <= s.start))
      return setError("끝나는 시각이 시작보다 빠른 후보가 있어요.");

    setSubmitting(true);
    const creatorToken = getCreatorToken();

    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .insert({
        creator_token: creatorToken,
        title: title.trim(),
        purpose,
        min_duration_minutes: minDuration,
      })
      .select("id")
      .single();

    if (meetingError || !meeting) {
      setSubmitting(false);
      setError("모임을 만들지 못했어요. 잠시 뒤 다시 시도해주세요.");
      return;
    }

    const { error: slotError } = await supabase.from("time_candidates").insert(
      parsed.map((s) => ({
        meeting_id: meeting.id,
        start_at: s.start.toISOString(),
        end_at: s.end.toISOString(),
      })),
    );

    if (slotError) {
      setSubmitting(false);
      setError("시간 후보를 저장하지 못했어요.");
      return;
    }

    router.push(`/create/done?m=${meeting.id}`);
  }

  return (
    <div className="pt-2">
      <h1 className="text-[24px] font-bold tracking-tight">모임 만들기</h1>
      <p className="mt-1.5 text-[14px] text-ink-soft">
        네 가지만 정하면 공유 링크가 나와요.
      </p>

      <section className="mt-7">
        <Label step={1}>모임 이름</Label>
        <input
          className="field mt-2.5"
          value={title}
          maxLength={40}
          placeholder="예: 중간고사 스터디"
          onChange={(e) => setTitle(e.target.value)}
        />
      </section>

      <section className="mt-7">
        <Label step={2}>어떤 모임인가요</Label>
        <div className="mt-2.5">
          <PurposeSelector value={purpose} onChange={setPurpose} />
        </div>
      </section>

      <section className="mt-7">
        <Label step={3}>최소 몇 시간 필요한가요</Label>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {DURATION_PRESETS.map((preset) => {
            const active = !customDuration && duration === preset.value;
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => {
                  setDuration(preset.value);
                  setCustomDuration("");
                }}
                className={`rounded-full border px-3.5 py-1.5 text-[13.5px] transition ${
                  active
                    ? "border-green bg-green text-white"
                    : "border-sand bg-white hover:border-green"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <input
            className="field"
            type="number"
            min={10}
            step={10}
            value={customDuration}
            placeholder="직접 입력"
            onChange={(e) => setCustomDuration(e.target.value)}
          />
          <span className="shrink-0 text-[14px] text-ink-soft">분</span>
        </div>
      </section>

      <section className="mt-7">
        <Label step={4}>후보 시간대</Label>
        <ul className="mt-2.5 space-y-2.5">
          {slots.map((slot, i) => (
            <li key={slot.key} className="card p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-ink-soft">
                  후보 {i + 1}
                </span>
                {slots.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSlot(slot.key)}
                    className="text-[13px] text-coral"
                  >
                    빼기
                  </button>
                )}
              </div>
              <div className="mt-2.5 space-y-2">
                <label className="flex items-center gap-2">
                  <span className="w-9 shrink-0 text-[13px] text-ink-soft">
                    시작
                  </span>
                  <input
                    className="field"
                    type="datetime-local"
                    value={slot.start}
                    onChange={(e) =>
                      updateSlot(slot.key, { start: e.target.value })
                    }
                  />
                </label>
                <label className="flex items-center gap-2">
                  <span className="w-9 shrink-0 text-[13px] text-ink-soft">
                    종료
                  </span>
                  <input
                    className="field"
                    type="datetime-local"
                    value={slot.end}
                    onChange={(e) =>
                      updateSlot(slot.key, { end: e.target.value })
                    }
                  />
                </label>
              </div>
            </li>
          ))}
        </ul>
        <button type="button" onClick={addSlot} className="btn-ghost mt-2.5 w-full">
          시간 추가
        </button>
      </section>

      {error && (
        <p className="mt-6 rounded-[12px] bg-coral-soft px-3.5 py-2.5 text-[13.5px] text-coral">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={submitting}
        className="btn-primary mt-6 w-full"
      >
        {submitting ? "만드는 중" : "링크 만들기"}
      </button>
    </div>
  );
}

function Label({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-[16px] font-semibold">
      <span className="flex size-5 items-center justify-center rounded-full bg-green-soft text-[11.5px] font-bold text-green-dark">
        {step}
      </span>
      {children}
    </h2>
  );
}
