"use client";

import { useState } from "react";
import Icon from "./Icon";
import { getCurrentPosition } from "@/lib/geo";
import { kakaoKey, searchPlace, type KakaoPlace } from "@/lib/kakao";

export interface Departure {
  text: string;
  lat: number | null;
  lng: number | null;
}

/**
 * 출발지를 받는 입력칸.
 * 좌표까지 있으면 지도와 소요시간 계산에 쓰이고, 글자만 있어도 그대로 저장된다.
 */
export default function DeparturePicker({
  value,
  onChange,
}: {
  value: Departure;
  onChange: (next: Departure) => void;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState<"gps" | "search" | null>(null);
  const [results, setResults] = useState<KakaoPlace[]>([]);

  const canSearch = Boolean(kakaoKey());
  const pinned = value.lat !== null && value.lng !== null;

  async function useCurrent() {
    setBusy("gps");
    setStatus(null);
    setResults([]);
    try {
      const point = await getCurrentPosition();
      onChange({
        text: value.text.trim() || "지금 있는 곳",
        lat: point.lat,
        lng: point.lng,
      });
      setStatus("현재 위치를 넣었어요.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "위치를 못 찾았어요.");
    } finally {
      setBusy(null);
    }
  }

  async function search() {
    const keyword = value.text.trim();
    if (!keyword) {
      setStatus("먼저 장소 이름을 적어주세요.");
      return;
    }
    setBusy("search");
    setStatus(null);
    const found = await searchPlace(keyword);
    setBusy(null);
    setResults(found.slice(0, 4));
    if (found.length === 0) setStatus("그 이름으로는 못 찾았어요.");
  }

  function pick(place: KakaoPlace) {
    onChange({
      text: place.place_name,
      lat: Number(place.y),
      lng: Number(place.x),
    });
    setResults([]);
    setStatus("장소를 지도에 찍었어요.");
  }

  return (
    <div>
      <input
        className="field"
        value={value.text}
        maxLength={40}
        placeholder="어디서 출발하나요 (예: 성균관대학교)"
        onChange={(e) => {
          onChange({ ...value, text: e.target.value });
          setStatus(null);
        }}
      />

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={useCurrent}
          disabled={busy !== null}
          className="chip-btn"
        >
          <Icon name="target" size={15} />
          {busy === "gps" ? "찾는 중" : "지금 있는 곳"}
        </button>

        {canSearch && (
          <button
            type="button"
            onClick={search}
            disabled={busy !== null}
            className="chip-btn"
          >
            <Icon name="map" size={15} />
            {busy === "search" ? "찾는 중" : "장소 찾기"}
          </button>
        )}

        {pinned && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-soft px-3 py-1.5 text-[13px] font-medium text-green-dark">
            <Icon name="pin" size={14} />
            위치 저장됨
          </span>
        )}
      </div>

      {results.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {results.map((place) => (
            <li key={`${place.x}-${place.y}-${place.place_name}`}>
              <button
                type="button"
                onClick={() => pick(place)}
                className="w-full rounded-[12px] border border-sand bg-white px-3.5 py-2.5 text-left transition hover:border-green"
              >
                <span className="block text-[14px] font-medium">
                  {place.place_name}
                </span>
                <span className="mt-0.5 block text-[12.5px] text-ink-soft">
                  {place.road_address_name || place.address_name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {status && <p className="mt-2 text-[13px] text-ink-soft">{status}</p>}

      {!pinned && (
        <p className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">
          위치를 남겨주시면 다들 얼마나 걸리는지 계산해서 중간쯤에 자리를
          잡아드려요. 글자만 적으셔도 괜찮아요.
        </p>
      )}
    </div>
  );
}
