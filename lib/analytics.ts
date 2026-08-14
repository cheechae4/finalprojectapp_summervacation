"use client";

type GtagParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (
      command: "config" | "event" | "js",
      target: string | Date,
      params?: GtagParams,
    ) => void;
  }
}

export function gaId(): string | undefined {
  return process.env.NEXT_PUBLIC_GA_ID?.trim() || undefined;
}

/**
 * 어디까지 쓰다가 그만두는지 보려고 흐름의 마디마다 남긴다.
 * 애널리틱스를 안 붙였으면 아무 일도 하지 않는다.
 */
export function track(event: string, params?: GtagParams) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", event, params);
}

export function trackPageView(path: string) {
  const id = gaId();
  if (typeof window === "undefined" || !window.gtag || !id) return;
  window.gtag("config", id, { page_path: path });
}
