"use client";

import Link from "next/link";
import Loading from "@/components/Loading";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import RecommendationCard from "@/components/RecommendationCard";
import { formatDuration, formatRange } from "@/lib/format";
import {
  fallbackReason,
  reasonPoints,
  scoreCandidates,
} from "@/lib/recommendation";
import { track } from "@/lib/analytics";
import { supabase } from "@/lib/supabase";
import { PURPOSE_LABEL } from "@/lib/types";
import { useCreatorToken } from "@/lib/useClientValue";
import { useMeeting } from "@/lib/useMeeting";

export default function ResultPage() {
  const meetingId = useParams<{ meetingId: string }>().meetingId;
  const router = useRouter();
  const { data, error, loading } = useMeeting(meetingId);

  const [reason, setReason] = useState<string | null>(null);
  const [commentSummary, setCommentSummary] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const creatorToken = useCreatorToken();
  const isCreator = Boolean(
    data && creatorToken && creatorToken === data.meeting.creator_token,
  );

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

  const top = scores[0];

  const comments = useMemo(() => {
    if (!data) return [];
    const nameOf = new Map(data.participants.map((p) => [p.id, p.name]));
    return data.votes
      .filter((v) => v.comment?.trim())
      .map((v) => ({
        id: v.id,
        name: nameOf.get(v.participant_id) ?? "익명",
        comment: v.comment as string,
        candidateId: v.candidate_id,
      }));
  }, [data]);

  // 추천 이유 문장은 서버에서 만든다. 실패하면 규칙 기반 문장으로 채운다.
  useEffect(() => {
    if (!data || !top) return;
    let cancelled = false;

    async function ask() {
      try {
        const res = await fetch("/api/reason", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            purpose: data!.meeting.purpose,
            meetingTitle: data!.meeting.title,
            timeLabel: formatRange(top.candidate.start_at, top.candidate.end_at),
            participantCount: data!.participants.length,
            attendable: top.attendable,
            preferred: top.preferred,
            durationLabel: formatDuration(top.durationMin),
            requiredLabel: formatDuration(data!.meeting.min_duration_minutes),
            comments: comments.map((c) => `${c.name}: ${c.comment}`),
          }),
        });
        const body = (await res.json()) as {
          reason: string | null;
          commentSummary: string | null;
        };
        if (cancelled) return;
        setReason(body.reason);
        setCommentSummary(body.commentSummary);
      } catch {
        if (!cancelled) setReason(null);
      }
    }

    void ask();
    return () => {
      cancelled = true;
    };
  }, [data, top, comments]);

  async function confirm() {
    if (!data || !top) return;
    setConfirming(true);
    await supabase
      .from("meetings")
      .update({
        status: "confirmed",
        confirmed_candidate_id: top.candidate.id,
      })
      .eq("id", data.meeting.id);
    track("meeting_confirm", { from: "result" });
    router.push(`/e/${data.meeting.id}/confirm`);
  }

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

  const { meeting, participants } = data;
  const rest = scores.slice(1);

  return (
    <div className="pt-2">
      <h1 className="text-[22px] font-bold tracking-tight">{meeting.title}</h1>
      <p className="mt-1 text-[13.5px] text-ink-soft">
        {PURPOSE_LABEL[meeting.purpose]} · {participants.length}명 참여 · 최소{" "}
        {formatDuration(meeting.min_duration_minutes)} 필요
      </p>

      {!top ? (
        <div className="card mt-6 p-5 text-[14px] text-ink-soft">
          아직 시간 후보가 없어요.
        </div>
      ) : (
        <>
          <p className="mt-6 text-[13px] font-medium text-ink-soft">
            이 시간을 추천해요
          </p>
          <div className="mt-2">
            <RecommendationCard score={top} participantCount={participants.length} />
          </div>

          <section className="mt-6">
            <h2 className="text-[16px] font-semibold">왜 이 시간인가요</h2>
            <ul className="mt-2.5 space-y-1.5">
              {reasonPoints(
                top,
                participants.length,
                meeting.purpose,
                meeting.min_duration_minutes,
              ).map((point) => (
                <li
                  key={point.text}
                  className="flex gap-2 text-[14px] leading-relaxed"
                >
                  <span
                    className={point.ok ? "text-green" : "text-ink-soft"}
                    aria-hidden
                  >
                    {point.ok ? "✓" : "·"}
                  </span>
                  <span className={point.ok ? "" : "text-ink-soft"}>
                    {point.text}
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-3.5 rounded-[12px] bg-white px-3.5 py-3 text-[14px] leading-relaxed">
              {reason ?? fallbackReason(top, participants.length)}
            </p>
          </section>
        </>
      )}

      {rest.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[16px] font-semibold">다음 후보</h2>
          <ul className="mt-2.5 space-y-2.5">
            {rest.map((score, i) => (
              <li key={score.candidate.id}>
                <RecommendationCard
                  score={score}
                  participantCount={participants.length}
                  rank={i + 2}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {comments.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[16px] font-semibold">참가자가 남긴 말</h2>
          {commentSummary && (
            <p className="mt-2 rounded-[12px] bg-green-soft px-3.5 py-2.5 text-[13.5px] leading-relaxed text-green-dark">
              {commentSummary}
            </p>
          )}
          <ul className="mt-2.5 space-y-2">
            {comments.map((c) => (
              <li key={c.id} className="card p-3.5">
                <p className="text-[13px] font-medium text-ink-soft">{c.name}</p>
                <p className="mt-0.5 text-[14px] leading-relaxed">{c.comment}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 space-y-2.5">
        <Link href={`/e/${meeting.id}/location`} className="btn-ghost w-full">
          장소도 추천받기
        </Link>
        <Link href={`/e/${meeting.id}/checklist`} className="btn-ghost w-full">
          준비물 정리하기
        </Link>
        <Link href={`/e/${meeting.id}`} className="btn-ghost w-full">
          내 투표 고치기
        </Link>
        {isCreator && top && meeting.status !== "confirmed" && (
          <button
            type="button"
            onClick={confirm}
            disabled={confirming}
            className="btn-primary w-full"
          >
            {confirming ? "확정하는 중" : "이 시간으로 확정하기"}
          </button>
        )}
        {meeting.status === "confirmed" && (
          <Link href={`/e/${meeting.id}/confirm`} className="btn-primary w-full">
            확정된 일정 보기
          </Link>
        )}
      </div>
    </div>
  );
}
