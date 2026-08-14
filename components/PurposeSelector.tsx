"use client";

import { PURPOSE_DESC, PURPOSE_LABEL, type Purpose } from "@/lib/types";

const ORDER: Purpose[] = ["study", "meeting", "meal", "social"];

export default function PurposeSelector({
  value,
  onChange,
}: {
  value: Purpose | null;
  onChange: (purpose: Purpose) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {ORDER.map((purpose) => {
        const selected = value === purpose;
        return (
          <button
            key={purpose}
            type="button"
            onClick={() => onChange(purpose)}
            aria-pressed={selected}
            className={`rounded-[14px] border p-3.5 text-left transition ${
              selected
                ? "border-green bg-green-soft"
                : "border-sand bg-white hover:border-green"
            }`}
          >
            <span className="block text-[15px] font-semibold">
              {PURPOSE_LABEL[purpose]}
            </span>
            <span className="mt-1 block text-[12.5px] leading-snug text-ink-soft">
              {PURPOSE_DESC[purpose]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
