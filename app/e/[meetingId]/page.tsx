"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import DeparturePicker, { type Departure } from "@/components/DeparturePicker";
import Loading from "@/components/Loading";
import TimeCandidateCard from "@/components/TimeCandidateCard";
import { formatDuration } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/analytics";
import { createParticipantToken } from "@/lib/tokens";
import { PURPOSE_LABEL, type Participant, type VoteStatus } from "@/lib/types";
import { useParticipantToken } from "@/lib/useClientValue";
import { useMeeting } from "@/lib/useMeeting";

interface Draft {
  status: VoteStatus | null;
  comment: string;
}

export default function VotePage() {
  const meetingId = useParams<{ meetingId: string }>().meetingId;
  const router = useRouter();
  const { data, error, loading, reload } = useMeeting(meetingId);

  const [joined, setJoined] = useState<Participant | null>(null);
  const [nameEdit, setNameEdit] = useState<string | null>(null);
  const [departureEdit, setDepartureEdit] = useState<Departure | null>(null);
  const [draftEdits, setDraftEdits] = useState<Record<string, Draft> | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // 재접속하면 저장해둔 토큰으로 내 참가 정보와 투표를 되살린다.
  const storedToken = useParticipantToken(meetingId);
  const known = useMemo(() => {
    if (!data || !storedToken) return null;
    return (
      data.participants.find((p) => p.participant_token === storedToken) ?? null
    );
  }, [data, storedToken]);

  const me = joined ?? known;
  const name = nameEdit ?? me?.name ?? "";
  const departure: Departure = departureEdit ?? {
    text: me?.departure_location ?? "",
    lat: me?.departure_lat ?? null,
    lng: me?.departure_lng ?? null,
  };

  const savedDrafts = useMemo<Record<string, Draft>>(() => {
    if (!data || !me) return {};
    return Object.fromEntries(
      data.votes
        .filter((v) => v.participant_id === me.id)
        .map((v) => [
          v.candidate_id,
          { status: v.status, comment: v.comment ?? "" },
        ]),
    );
  }, [data, me]);

  const drafts = draftEdits ?? savedDrafts;

  function patchDraft(candidateId: string, patch: Partial<Draft>) {
    setDraftEdits((prev) => {
      const base = prev ?? savedDrafts;
      const current = base[candidateId] ?? { status: null, comment: "" };
      return { ...base, [candidateId]: { ...current, ...patch } };
    });
  }

  const summary = useMemo(() => {
    const values = Object.values(drafts);
    return {
      preferred: values.filter((d) => d.status === "preferred").length,
      available: values.filter((d) => d.status === "available").length,
      unavailable: values.filter((d) => d.status === "unavailable").length,
    };
  }, [drafts]);

  async function join() {
    if (!data) return;
    if (!name.trim()) {
      setFormError("이름을 적어주세요.");
      return;
    }

    setBusy(true);
    setFormError(null);

    const token = createParticipantToken(data.meeting.id);
    const { data: inserted, error: insertError } = await supabase
      .from("participants")
      .insert({
        meeting_id: data.meeting.id,
        participant_token: token,
        name: name.trim(),
        departure_location: departure.text.trim() || null,
        departure_lat: departure.lat,
        departure_lng: departure.lng,
      })
      .select("*")
      .single();

    setBusy(false);
    if (insertError || !inserted) {
      setFormError("참여하지 못했어요. 잠시 뒤 다시 시도해주세요.");
      return;
    }
    track("participant_join", { has_location: departure.lat !== null });
    setJoined(inserted as Participant);
    void reload();
  }

  async function saveVotes() {
    if (!data || !me) return;

    const rows = Object.entries(drafts)
      .filter(([, draft]) => draft.status !== null)
      .map(([candidateId, draft]) => ({
        participant_id: me.id,
        candidate_id: candidateId,
        status: draft.status as VoteStatus,
        comment: draft.comment.trim() || null,
      }));

    if (rows.length === 0) {
      setFormError("후보마다 되는지 안 되는지 골라주세요.");
      return;
    }

    setBusy(true);
    setFormError(null);

    const [{ error: voteError }] = await Promise.all([
      supabase.from("votes").upsert(rows, {
        onConflict: "participant_id,candidate_id",
      }),
      supabase
        .from("participants")
        .update({
          name: name.trim() || me.name,
          departure_location: departure.text.trim() || null,
          departure_lat: departure.lat,
          departure_lng: departure.lng,
        })
        .eq("id", me.id),
    ]);

    setBusy(false);
    if (voteError) {
      setFormError("저장하지 못했어요. 잠시 뒤 다시 시도해주세요.");
      return;
    }

    track("vote_save", { votes: rows.length });
    setSaved(true);
    router.push(`/e/${data.meeting.id}/result`);
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

  const { meeting, candidates } = data;

  return (
    <div className="pt-2">
      <div className="card p-4">
        <h1 className="text-[20px] font-bold tracking-tight">{meeting.title}</h1>
        <p className="mt-1 text-[13.5px] text-ink-soft">
          {PURPOSE_LABEL[meeting.purpose]} · 최소{" "}
          {formatDuration(meeting.min_duration_minutes)} 필요 · 지금까지{" "}
          {data.participants.length}명 참여
        </p>
      </div>

      {!me ? (
        <section className="mt-6">
          <h2 className="text-[16px] font-semibold">먼저 이름을 알려주세요</h2>
          <input
            className="field mt-2.5"
            value={name}
            maxLength={20}
            placeholder="이름"
            onChange={(e) => setNameEdit(e.target.value)}
          />
          <div className="mt-2.5">
            <DeparturePicker value={departure} onChange={setDepartureEdit} />
          </div>
          {formError && (
            <p className="mt-3 text-[13.5px] text-coral">{formError}</p>
          )}
          <button
            type="button"
            onClick={join}
            disabled={busy}
            className="btn-primary mt-4 w-full"
          >
            {busy ? "참여하는 중" : "참여하기"}
          </button>
          <Link
            href={`/e/${meeting.id}/result`}
            className="mt-3 block text-center text-[13.5px] text-green underline underline-offset-4"
          >
            투표는 나중에, 결과부터 보기
          </Link>
        </section>
      ) : (
        <section className="mt-6">
          <details className="card p-4">
            <summary className="cursor-pointer list-none text-[14px] font-medium">
              출발지
              <span className="ml-1.5 font-normal text-ink-soft">
                {departure.text || "아직 안 적었어요"}
              </span>
            </summary>
            <div className="mt-3">
              <DeparturePicker value={departure} onChange={setDepartureEdit} />
            </div>
          </details>

          <div className="mt-6 flex items-baseline justify-between">
            <h2 className="text-[16px] font-semibold">언제 되세요?</h2>
            <p className="text-[12.5px] text-ink-soft">
              선호 {summary.preferred} · 가능 {summary.available} · 불가{" "}
              {summary.unavailable}
            </p>
          </div>

          <ul className="mt-3 space-y-2.5">
            {candidates.map((candidate) => (
              <TimeCandidateCard
                key={candidate.id}
                candidate={candidate}
                status={drafts[candidate.id]?.status ?? null}
                comment={drafts[candidate.id]?.comment ?? ""}
                onStatusChange={(status) => patchDraft(candidate.id, { status })}
                onCommentChange={(comment) =>
                  patchDraft(candidate.id, { comment })
                }
              />
            ))}
          </ul>

          {formError && (
            <p className="mt-3 text-[13.5px] text-coral">{formError}</p>
          )}

          <button
            type="button"
            onClick={saveVotes}
            disabled={busy}
            className="btn-primary mt-5 w-full"
          >
            {busy ? "저장하는 중" : saved ? "저장했어요" : "저장하고 결과 보기"}
          </button>
        </section>
      )}
    </div>
  );
}
