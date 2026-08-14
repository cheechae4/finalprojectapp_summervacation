"use client";

type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (
      command: "config" | "event" | "js",
      target: string | Date,
      params?: Params,
    ) => void;
  }
}

/** GA4 측정 ID (G-...). 태그매니저를 쓴다면 비워도 된다. */
export function gaId(): string | undefined {
  return process.env.NEXT_PUBLIC_GA_ID?.trim() || undefined;
}

/** 구글 태그매니저 컨테이너 ID (GTM-...). */
export function gtmId(): string | undefined {
  return process.env.NEXT_PUBLIC_GTM_ID?.trim() || undefined;
}

/**
 * 어디까지 쓰다가 그만두는지 보려고 흐름의 마디마다 남긴다.
 * GA4를 직접 붙였으면 gtag로, 태그매니저를 쓰면 dataLayer로 보낸다.
 * 둘 다 없으면 아무 일도 하지 않는다.
 */
export function track(event: string, params?: Params) {
  if (typeof window === "undefined") return;

  if (window.gtag) {
    window.gtag("event", event, params);
    return;
  }
  if (window.dataLayer) {
    window.dataLayer.push({ event, ...params });
  }
}

export function trackPageView(path: string) {
  if (typeof window === "undefined") return;

  const id = gaId();
  if (window.gtag && id) {
    window.gtag("config", id, { page_path: path });
    return;
  }
  if (window.dataLayer) {
    window.dataLayer.push({ event: "page_view", page_path: path });
  }
}
