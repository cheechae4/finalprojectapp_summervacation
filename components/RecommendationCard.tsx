import { formatDate, formatDuration, formatTime } from "@/lib/format";
import type { CandidateScore } from "@/lib/recommendation";

export default function RecommendationCard({
  score,
  participantCount,
  rank,
}: {
  score: CandidateScore;
  participantCount: number;
  rank?: number;
}) {
  const { candidate } = score;

  return (
    <div
      className={`card p-5 ${
        rank === undefined ? "border-green bg-green-soft" : ""
      }`}
    >
      {rank !== undefined && (
        <p className="mb-1.5 text-[12.5px] text-ink-soft">{rank}순위</p>
      )}
      <p className="text-[19px] font-bold tracking-tight">
        {formatDate(candidate.start_at)}
      </p>
      <p className="text-[15px] text-ink-soft">
        {formatTime(candidate.start_at)}–{formatTime(candidate.end_at)} ·{" "}
        {formatDuration(score.durationMin)}
      </p>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Stat label="참석 가능" value={`${score.attendable}명`} />
        <Stat label="이 시간 선호" value={`${score.preferred}명`} />
        <Stat label="전체" value={`${participantCount}명`} />
      </dl>

      {score.excluded && (
        <p className="mt-3 rounded-[10px] bg-coral-soft px-3 py-2 text-[13px] text-coral">
          {score.excludedReason}
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] bg-white/70 px-2 py-2.5">
      <dt className="text-[12px] text-ink-soft">{label}</dt>
      <dd className="mt-0.5 text-[15px] font-semibold">{value}</dd>
    </div>
  );
}
