"use client";

import { useState } from "react";
import Icon from "./Icon";
import VoteToggle from "./VoteToggle";
import { durationMinutes, formatDate, formatDuration, formatTime } from "@/lib/format";
import type { TimeCandidate, VoteStatus } from "@/lib/types";

export default function TimeCandidateCard({
  candidate,
  status,
  comment,
  onStatusChange,
  onCommentChange,
}: {
  candidate: TimeCandidate;
  status: VoteStatus | null;
  comment: string;
  onStatusChange: (status: VoteStatus) => void;
  onCommentChange: (comment: string) => void;
}) {
  const [openComment, setOpenComment] = useState(Boolean(comment));
  const minutes = durationMinutes(candidate.start_at, candidate.end_at);

  return (
    <li className="card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <p className="text-[15px] font-semibold">
            {formatDate(candidate.start_at)}
          </p>
          <p className="text-[14px] text-ink-soft">
            {formatTime(candidate.start_at)}–{formatTime(candidate.end_at)}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-cream px-2.5 py-1 text-[12px] text-ink-soft">
          <Icon name="clock" size={13} />
          {formatDuration(minutes)}
        </span>
      </div>

      <div className="mt-3">
        <VoteToggle value={status} onChange={onStatusChange} />
      </div>

      {openComment ? (
        <input
          className="field mt-2.5 text-[14px]"
          value={comment}
          maxLength={120}
          autoFocus={!comment}
          placeholder="예: 3시 이후에는 수업이 있어요"
          onChange={(e) => onCommentChange(e.target.value)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setOpenComment(true)}
          className="mt-2.5 text-[13px] text-green underline underline-offset-4"
        >
          이유 남기기
        </button>
      )}
    </li>
  );
}
