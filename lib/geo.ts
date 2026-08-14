export interface Point {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

/** 두 지점 사이 직선거리(km). */
export function distanceKm(a: Point, b: Point): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** 여러 지점의 한가운데. 위도·경도를 그대로 평균 낸다(국내 거리에서는 오차가 작다). */
export function centroid(points: Point[]): Point | null {
  if (points.length === 0) return null;
  const sum = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 },
  );
  return { lat: sum.lat / points.length, lng: sum.lng / points.length };
}

export type TravelMode = "walk" | "transit";

export interface TravelEstimate {
  mode: TravelMode;
  minutes: number;
  km: number;
}

/**
 * 직선거리로 이동 시간을 어림잡는다.
 * 길찾기 API 없이 계산하므로 실제 경로보다 짧게 나온다. 화면에서는 어림값이라고 밝힌다.
 *
 * - 1.2km 미만은 걸어가는 편이라 도보 속도(시속 4.5km)로 본다.
 * - 그 이상은 대중교통. 도심 실효 속도를 시속 18km로 두고, 기다리고 갈아타는 시간 8분을 더한다.
 * - 실제 길은 직선이 아니라서 거리에 1.3배를 곱한다.
 */
export function estimateTravel(from: Point, to: Point): TravelEstimate {
  const straight = distanceKm(from, to);
  const routed = straight * 1.3;

  if (straight < 1.2) {
    return {
      mode: "walk",
      km: straight,
      minutes: Math.max(1, Math.round((routed / 4.5) * 60)),
    };
  }

  return {
    mode: "transit",
    km: straight,
    minutes: Math.max(5, Math.round((routed / 18) * 60) + 8),
  };
}

export function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}분`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
}

/** 가장 오래 걸리는 사람 기준으로 얼마나 공평한지 한 줄로 알려준다. */
export function fairnessNote(minutesList: number[]): string | null {
  if (minutesList.length < 2) return null;
  const max = Math.max(...minutesList);
  const min = Math.min(...minutesList);
  const gap = max - min;

  if (gap <= 10) return "다들 비슷하게 걸려요.";
  if (gap <= 25) return `제일 먼 사람이 ${gap}분쯤 더 걸려요.`;
  return `제일 먼 사람과 가까운 사람이 ${gap}분 차이 나요. 조금 옮기는 것도 생각해보세요.`;
}

/** 브라우저 위치 권한으로 현재 좌표를 받는다. */
export function getCurrentPosition(): Promise<Point> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("이 브라우저에서는 위치를 쓸 수 없어요."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error("위치 권한이 막혀 있어요. 직접 적어주세요."));
        } else {
          reject(new Error("위치를 못 찾았어요. 직접 적어주세요."));
        }
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  });
}
