"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { Meeting, Participant, TimeCandidate, Vote } from "./types";

export interface MeetingData {
  meeting: Meeting;
  candidates: TimeCandidate[];
  participants: Participant[];
  votes: Vote[];
}

interface LoadResult {
  data: MeetingData | null;
  error: string | null;
}

/** 모임 한 건에 딸린 후보·참가자·투표를 한 번에 읽어온다. */
export function useMeeting(meetingId: string | undefined) {
  const [data, setData] = useState<MeetingData | null>(null);
  const [error, setError] = useState<string | null>(
    meetingId ? null : "주소가 잘못됐어요.",
  );
  const [loading, setLoading] = useState(Boolean(meetingId));

  const fetchAll = useCallback(async (): Promise<LoadResult> => {
    if (!meetingId) return { data: null, error: "주소가 잘못됐어요." };

    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .select("*")
      .eq("id", meetingId)
      .maybeSingle();

    if (meetingError) {
      return { data: null, error: "모임 정보를 불러오지 못했어요." };
    }
    if (!meeting) {
      return { data: null, error: "이 링크에 해당하는 모임이 없어요." };
    }

    const [candidatesRes, participantsRes] = await Promise.all([
      supabase
        .from("time_candidates")
        .select("*")
        .eq("meeting_id", meetingId)
        .order("start_at"),
      supabase
        .from("participants")
        .select("*")
        .eq("meeting_id", meetingId)
        .order("created_at"),
    ]);

    const participants = (participantsRes.data ?? []) as Participant[];
    const participantIds = participants.map((p) => p.id);

    let votes: Vote[] = [];
    if (participantIds.length > 0) {
      const votesRes = await supabase
        .from("votes")
        .select("*")
        .in("participant_id", participantIds);
      votes = (votesRes.data ?? []) as Vote[];
    }

    return {
      data: {
        meeting: meeting as Meeting,
        candidates: (candidatesRes.data ?? []) as TimeCandidate[],
        participants,
        votes,
      },
      error: null,
    };
  }, [meetingId]);

  const apply = useCallback((result: LoadResult) => {
    setData(result.data);
    setError(result.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    void fetchAll().then((result) => {
      if (active) apply(result);
    });
    return () => {
      active = false;
    };
  }, [fetchAll, apply]);

  const reload = useCallback(
    () => fetchAll().then(apply),
    [fetchAll, apply],
  );

  return { data, error, loading, reload };
}
