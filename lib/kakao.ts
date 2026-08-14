"use client";

/**
 * 카카오맵 SDK를 필요할 때 한 번만 불러온다.
 * 키가 없으면 null을 돌려주고, 화면은 좌표만으로 그리는 간단한 지도로 대체한다.
 */

export interface KakaoLatLng {
  getLat(): number;
  getLng(): number;
}

export interface KakaoMap {
  setCenter(latlng: KakaoLatLng): void;
  setLevel(level: number): void;
  relayout(): void;
}

export interface KakaoBounds {
  extend(latlng: KakaoLatLng): void;
}

export interface KakaoPlace {
  place_name: string;
  road_address_name?: string;
  address_name: string;
  x: string;
  y: string;
}

interface KakaoMarkerOptions {
  position: KakaoLatLng;
  map?: KakaoMap;
  image?: unknown;
  zIndex?: number;
}

interface KakaoOverlayOptions {
  position: KakaoLatLng;
  content: string | HTMLElement;
  map?: KakaoMap;
  yAnchor?: number;
  zIndex?: number;
}

export interface KakaoNamespace {
  maps: {
    load(callback: () => void): void;
    LatLng: new (lat: number, lng: number) => KakaoLatLng;
    LatLngBounds: new () => KakaoBounds;
    Map: new (
      container: HTMLElement,
      options: { center: KakaoLatLng; level: number; draggable?: boolean },
    ) => KakaoMap & { setBounds(bounds: KakaoBounds): void };
    Marker: new (options: KakaoMarkerOptions) => { setMap(map: KakaoMap | null): void };
    CustomOverlay: new (options: KakaoOverlayOptions) => {
      setMap(map: KakaoMap | null): void;
    };
    MarkerImage: new (
      src: string,
      size: unknown,
      options?: unknown,
    ) => unknown;
    Size: new (w: number, h: number) => unknown;
    Point: new (x: number, y: number) => unknown;
    services: {
      Places: new () => {
        keywordSearch(
          keyword: string,
          callback: (data: KakaoPlace[], status: string) => void,
        ): void;
      };
      Status: { OK: string };
    };
  };
}

declare global {
  interface Window {
    kakao?: KakaoNamespace;
  }
}

let loader: Promise<KakaoNamespace | null> | null = null;

export function kakaoKey(): string | undefined {
  return process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
}

export function loadKakao(): Promise<KakaoNamespace | null> {
  if (loader) return loader;

  const key = kakaoKey();
  if (!key) {
    loader = Promise.resolve(null);
    return loader;
  }

  loader = new Promise((resolve) => {
    if (window.kakao?.maps?.LatLng) {
      resolve(window.kakao);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = () => {
      const kakao = window.kakao;
      if (!kakao) {
        resolve(null);
        return;
      }
      kakao.maps.load(() => resolve(kakao));
    };
    script.onerror = () => {
      console.warn("카카오맵 SDK를 불러오지 못했어요. 키와 도메인 등록을 확인하세요.");
      resolve(null);
    };
    document.head.appendChild(script);
  });

  return loader;
}

/** 장소 이름으로 좌표를 찾는다. 키가 없거나 못 찾으면 빈 배열. */
export async function searchPlace(keyword: string): Promise<KakaoPlace[]> {
  const kakao = await loadKakao();
  if (!kakao) return [];

  return new Promise((resolve) => {
    const places = new kakao.maps.services.Places();
    places.keywordSearch(keyword, (data, status) => {
      resolve(status === kakao.maps.services.Status.OK ? data : []);
    });
  });
}

/** 적어준 장소 이름을 좌표 하나로 바꾼다. 못 찾으면 null. */
export async function resolvePoint(
  keyword: string,
): Promise<{ lat: number; lng: number } | null> {
  const text = keyword.trim();
  if (!text) return null;

  const found = await searchPlace(text);
  if (found.length === 0) return null;

  return { lat: Number(found[0].y), lng: Number(found[0].x) };
}

export type KakaoStatus = "ok" | "no-key" | "blocked";

/** 지도를 못 쓰는 이유를 구분한다. 화면에서 원인을 알려주려고 쓴다. */
export async function kakaoStatus(): Promise<KakaoStatus> {
  if (!kakaoKey()) return "no-key";
  return (await loadKakao()) ? "ok" : "blocked";
}
