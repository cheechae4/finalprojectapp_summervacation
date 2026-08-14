import { durationMinutes, formatDuration } from "./format";
import type { Purpose, TimeCandidate, Vote } from "./types";

export interface CandidateScore {
  candidate: TimeCandidate;
  preferred: number;
  available: number;
  unavailable: number;
  noReply: number;
  /** 참석 가능한 사람 수 (선호 + 가능) */
  attendable: number;
  durationMin: number;
  meetsDuration: boolean;
  score: number;
  /** 하드 필터에 걸려서 추천 후보에서 빠진 경우 */
  excluded: boolean;
  excludedReason?: string;
}

/**
 * 목적별로 무게를 다르게 준다.
 * 식사는 "가고 싶은 사람"이 많은 쪽, 친목은 "올 수 있는 사람"이 많은 쪽을 먼저 본다.
 */
const PREFERRED_WEIGHT: Record<Purpose, number> = {
  study: 2,
  meeting: 2,
  meal: 3,
  social: 2,
};

export function scoreCandidates(
  candidates: TimeCandidate[],
  votes: Vote[],
  participantCount: number,
  purpose: Purpose,
  minDurationMinutes: number,
): CandidateScore[] {
  const scored = candidates.map<CandidateScore>((candidate) => {
    const own = votes.filter((v) => v.candidate_id === candidate.id);
    const preferred = own.filter((v) => v.status === "preferred").length;
    const available = own.filter((v) => v.status === "available").length;
    const unavailable = own.filter((v) => v.status === "unavailable").length;
    const noReply = Math.max(0, participantCount - own.length);

    const durationMin = durationMinutes(candidate.start_at, candidate.end_at);
    const meetsDuration = durationMin >= minDurationMinutes;
    const attendable = preferred + available;

    let excludedReason: string | undefined;
    if (!meetsDuration) {
      excludedReason = `필요한 ${formatDuration(minDurationMinutes)}보다 짧아요`;
    } else if (participantCount > 0 && attendable === 0) {
      excludedReason = "가능한 사람이 없어요";
    }

    return {
      candidate,
      preferred,
      available,
      unavailable,
      noReply,
      attendable,
      durationMin,
      meetsDuration,
      score: preferred * PREFERRED_WEIGHT[purpose] + available,
      excluded: Boolean(excludedReason),
      excludedReason,
    };
  });

  return scored.sort((a, b) => {
    if (a.excluded !== b.excluded) return a.excluded ? 1 : -1;

    if (purpose === "social" && b.attendable !== a.attendable) {
      return b.attendable - a.attendable;
    }
    if (b.score !== a.score) return b.score - a.score;
    if (purpose === "study" && b.durationMin !== a.durationMin) {
      return b.durationMin - a.durationMin;
    }
    if (b.attendable !== a.attendable) return b.attendable - a.attendable;
    return (
      new Date(a.candidate.start_at).getTime() -
      new Date(b.candidate.start_at).getTime()
    );
  });
}

/** 추천 이유를 체크리스트로 보여줄 때 쓰는 문장들. */
export function reasonPoints(
  top: CandidateScore,
  participantCount: number,
  purpose: Purpose,
  minDurationMinutes: number,
): { ok: boolean; text: string }[] {
  const points: { ok: boolean; text: string }[] = [
    {
      ok: top.attendable === participantCount && participantCount > 0,
      text:
        participantCount > 0
          ? `${participantCount}명 중 ${top.attendable}명이 참석할 수 있어요`
          : "아직 투표한 사람이 없어요",
    },
    {
      ok: top.preferred > 0,
      text:
        top.preferred > 0
          ? `${top.preferred}명이 이 시간을 골랐어요`
          : "이 시간을 특별히 고른 사람은 없어요",
    },
    {
      ok: top.meetsDuration,
      text: top.meetsDuration
        ? `${formatDuration(top.durationMin)}이라 필요한 ${formatDuration(
            minDurationMinutes,
          )}을 채워요`
        : `${formatDuration(top.durationMin)}뿐이라 시간이 모자라요`,
    },
  ];

  if (purpose === "meal") {
    points.push({
      ok: true,
      text: "식사 모임이라 가고 싶어 하는 사람 수를 더 크게 봤어요",
    });
  } else if (purpose === "social") {
    points.push({
      ok: true,
      text: "친목 모임이라 몇 명이 올 수 있는지를 먼저 봤어요",
    });
  } else {
    points.push({
      ok: true,
      text: "시간을 충분히 확보할 수 있는 후보를 먼저 봤어요",
    });
  }

  return points;
}

/** Claude 응답이 없을 때 쓰는 문장. 규칙만으로 만든다. */
export function fallbackReason(
  top: CandidateScore,
  participantCount: number,
): string {
  if (participantCount === 0) {
    return "아직 투표한 사람이 없어서 후보 순서만 보여드려요.";
  }
  const parts = [`${participantCount}명 중 ${top.attendable}명이 참석 가능하고`];
  if (top.preferred > 0) parts.push(`${top.preferred}명이 이 시간을 골랐어요.`);
  else parts.push("일정도 겹치지 않아요.");
  parts.push(`${formatDuration(top.durationMin)}을 쓸 수 있습니다.`);
  return parts.join(" ");
}
