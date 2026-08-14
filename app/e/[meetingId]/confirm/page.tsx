"use client";

import Link from "next/link";
import Loading from "@/components/Loading";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import CopyLinkButton from "@/components/CopyLinkButton";
import { formatDuration, formatRange, durationMinutes } from "@/lib/format";
import { scoreCandidates } from "@/lib/recommendation";
import { supabase } from "@/lib/supabase";
import { PURPOSE_LABEL, type ChecklistItem } from "@/lib/types";
import { useCreatorToken, useOrigin } from "@/lib/useClientValue";
import { useMeeting } from "@/lib/useMeeting";

export default function ConfirmPage() {
  const meetingId = useParams<{ meetingId: string }>().meetingId;
  const { data, error, loading, reload } = useMeeting(meetingId);

  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [busy, setBusy] = useState(false);

  const origin = useOrigin();
  const creatorToken = useCreatorToken();
  const isCreator = Boolean(
    data && creatorToken && creatorToken === data.meeting.creator_token,
  );
  const shareUrl = meetingId ? `${origin}/e/${meetingId}/confirm` : "";

  useEffect(() => {
    if (!meetingId) return;
    void supabase
      .from("checklist_items")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("created_at")
      .then(({ data: rows }) => setItems((rows ?? []) as ChecklistItem[]));
  }, [meetingId]);

  const scores = useMemo(() => {
    if (!data) return [];
    return scoreCandidates(
      data.candidates,
      data.votes,
      data.participants.length,
      data.meeting.purpose,
      data.meeting.min_duration_minutes,
    );
  }, [data]);

  if (loading) {
    return <Loading />;
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

  const { meeting, candidates, participants } = data;
  const confirmed =
    candidates.find((c) => c.id === meeting.confirmed_candidate_id) ?? null;
  const suggestion = scores[0]?.candidate ?? null;
  const shown = confirmed ?? suggestion;

  const attendees = shown
    ? participants.filter((p) =>
        data.votes.some(
          (v) =>
            v.participant_id === p.id &&
            v.candidate_id === shown.id &&
            v.status !== "unavailable",
        ),
      )
    : [];

  const nameOf = new Map(participants.map((p) => [p.id, p.name]));

  async function confirmNow() {
    if (!suggestion) return;
    setBusy(true);
    await supabase
      .from("meetings")
      .update({ status: "confirmed", confirmed_candidate_id: suggestion.id })
      .eq("id", meeting.id);
    setBusy(false);
    void reload();
  }

  return (
    <div className="pt-2">
      <h1 className="text-[22px] font-bold tracking-tight">{meeting.title}</h1>
      <p className="mt-1 text-[13.5px] text-ink-soft">
        {confirmed ? "이렇게 하기로 했어요" : "아직 확정 전이에요"}
      </p>

      <dl className="card mt-5 divide-y divide-sand">
        <Row label="시간">
          {shown ? formatRange(shown.start_at, shown.end_at) : "미정"}
        </Row>
        <Row label="소요">
          {shown
            ? formatDuration(durationMinutes(shown.start_at, shown.end_at))
            : "미정"}
        </Row>
        <Row label="장소">{meeting.confirmed_location ?? "미정"}</Row>
        <Row label="목적">{PURPOSE_LABEL[meeting.purpose]}</Row>
        <Row label="참석">
          {attendees.length > 0
            ? `${attendees.length}명 · ${attendees.map((p) => p.name).join(", ")}`
            : "아직 없어요"}
        </Row>
      </dl>

      {items.length > 0 && (
        <section className="mt-7">
          <h2 className="text-[16px] font-semibold">준비할 것</h2>
          <ul className="mt-2.5 space-y-1.5">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex gap-2 text-[14px] leading-relaxed"
              >
                <span className={item.is_done ? "text-green" : "text-ink-soft"}>
                  {item.is_done ? "✓" : "·"}
                </span>
                <span className={item.is_done ? "text-ink-soft" : ""}>
                  {item.content}
                  {item.assignee_participant_id && (
                    <span className="text-ink-soft">
                      {" "}
                      — {nameOf.get(item.assignee_participant_id) ?? "담당자"}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 space-y-2.5">
        {!confirmed && isCreator && suggestion && (
          <button
            type="button"
            onClick={confirmNow}
            disabled={busy}
            className="btn-primary w-full"
          >
            {busy ? "확정하는 중" : "이 시간으로 확정하기"}
          </button>
        )}
        {shareUrl && <CopyLinkButton url={shareUrl} label="정리 링크 복사" />}
        <Link href={`/e/${meeting.id}/result`} className="btn-ghost w-full">
          시간 결과 다시 보기
        </Link>
        {!meeting.confirmed_location && (
          <Link href={`/e/${meeting.id}/location`} className="btn-ghost w-full">
            장소 정하기
          </Link>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 px-4 py-3">
      <dt className="w-12 shrink-0 text-[13.5px] text-ink-soft">{label}</dt>
      <dd className="flex-1 text-[14.5px]">{children}</dd>
    </div>
  );
}
