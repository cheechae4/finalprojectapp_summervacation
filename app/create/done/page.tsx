"use client";

import Link from "next/link";
import Loading from "@/components/Loading";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import CopyLinkButton from "@/components/CopyLinkButton";
import { supabase } from "@/lib/supabase";
import { useOrigin } from "@/lib/useClientValue";

export default function DonePage() {
  return (
    <Suspense
      fallback={<Loading />}
    >
      <DoneContent />
    </Suspense>
  );
}

function DoneContent() {
  const meetingId = useSearchParams().get("m");
  const origin = useOrigin();
  const [title, setTitle] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const shareUrl = meetingId ? `${origin}/e/${meetingId}` : "";

  useEffect(() => {
    if (!meetingId) return;
    void supabase
      .from("meetings")
      .select("title")
      .eq("id", meetingId)
      .maybeSingle()
      .then(({ data }) => setTitle(data?.title ?? null));
  }, [meetingId]);

  // 참여자 수는 방장이 링크를 뿌려둔 동안 계속 늘어나므로 주기적으로 다시 센다.
  useEffect(() => {
    if (!meetingId) return;

    function refresh() {
      return supabase
        .from("participants")
        .select("id", { count: "exact", head: true })
        .eq("meeting_id", meetingId)
        .then(({ count: participantCount }) => setCount(participantCount ?? 0));
    }

    void refresh();
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [meetingId]);

  if (!meetingId) {
    return (
      <div className="pt-8">
        <p className="text-[15px]">주소가 잘못됐어요.</p>
        <Link href="/create" className="btn-ghost mt-4 w-full">
          모임 다시 만들기
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-6">
      <h1 className="text-[24px] font-bold tracking-tight">
        모임이 만들어졌어요
      </h1>
      {title && <p className="mt-1.5 text-[15px] text-ink-soft">{title}</p>}

      <div className="card mt-6 p-4">
        <p className="text-[13px] text-ink-soft">공유 링크</p>
        <p className="mt-1.5 break-all text-[14px] font-medium">
          {shareUrl || " "}
        </p>
      </div>

      <div className="mt-3">
        <CopyLinkButton url={shareUrl} />
      </div>

      <p className="mt-4 text-center text-[14px] text-ink-soft">
        지금까지 {count}명이 참여했어요
      </p>

      <div className="mt-8 space-y-2.5">
        <Link href={`/e/${meetingId}`} className="btn-ghost w-full">
          나도 투표하기
        </Link>
        <Link href={`/e/${meetingId}/result`} className="btn-ghost w-full">
          결과 보기
        </Link>
      </div>
    </div>
  );
}
