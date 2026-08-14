"use client";

import { useCallback, useSyncExternalStore } from "react";
import { CREATOR_KEY, participantKey } from "./tokens";

// 브라우저에만 있는 값(주소, 로컬스토리지)을 서버 렌더와 어긋나지 않게 읽는다.
// 값이 도중에 바뀌지 않으므로 구독은 비워둔다.
const noopSubscribe = () => () => {};

export function useOrigin(): string {
  return useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => "",
  );
}

function useStoredValue(key: string | null): string | null {
  const read = useCallback(
    () => (key ? localStorage.getItem(key) : null),
    [key],
  );
  return useSyncExternalStore(noopSubscribe, read, () => null);
}

export function useCreatorToken(): string | null {
  return useStoredValue(CREATOR_KEY);
}

export function useParticipantToken(meetingId: string | undefined) {
  return useStoredValue(meetingId ? participantKey(meetingId) : null);
}
