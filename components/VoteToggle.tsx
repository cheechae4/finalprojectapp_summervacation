"use client";

import { VOTE_LABEL, type VoteStatus } from "@/lib/types";

const ORDER: VoteStatus[] = ["unavailable", "available", "preferred"];

const SELECTED_STYLE: Record<VoteStatus, string> = {
  unavailable: "bg-coral-soft text-coral border-coral",
  available: "bg-green-soft text-green-dark border-green",
  preferred: "bg-yellow-soft text-[#a97c1f] border-yellow",
};

export default function VoteToggle({
  value,
  onChange,
}: {
  value: VoteStatus | null;
  onChange: (status: VoteStatus) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {ORDER.map((status) => {
        const selected = value === status;
        return (
          <button
            key={status}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(status)}
            className={`rounded-[12px] border px-2 py-2 text-[13px] font-medium transition active:translate-y-px ${
              selected
                ? `${SELECTED_STYLE[status]} pop-in`
                : "border-sand bg-white text-ink-soft hover:border-green"
            }`}
          >
            {VOTE_LABEL[status]}
          </button>
        );
      })}
    </div>
  );
}
