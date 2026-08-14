"use client";

import { useEffect, useRef, useState } from "react";
import { loadKakao } from "@/lib/kakao";
import type { Point } from "@/lib/geo";

export interface MapPin extends Point {
  label: string;
  isMe?: boolean;
}

/**
 * 카카오맵 키가 있으면 진짜 지도를, 없으면 좌표만으로 그린 위치 관계도를 보여준다.
 * 둘 다 참가자 위치와 중간지점을 같은 모양으로 표시한다.
 */
export default function MeetingMap({
  pins,
  center,
  centerLabel = "중간 지점",
}: {
  pins: MapPin[];
  center: Point | null;
  centerLabel?: string;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState<"loading" | "kakao" | "plain">("loading");

  useEffect(() => {
    let cancelled = false;

    void loadKakao().then((kakao) => {
      if (cancelled) return;
      if (!kakao || !holder.current || pins.length === 0) {
        setReady("plain");
        return;
      }

      const first = pins[0];
      const map = new kakao.maps.Map(holder.current, {
        center: new kakao.maps.LatLng(first.lat, first.lng),
        level: 6,
      });

      const bounds = new kakao.maps.LatLngBounds();

      for (const pin of pins) {
        const position = new kakao.maps.LatLng(pin.lat, pin.lng);
        bounds.extend(position);
        new kakao.maps.CustomOverlay({
          position,
          map,
          yAnchor: 1.35,
          content: chip(pin.label, pin.isMe ? "me" : "person"),
        });
        new kakao.maps.Marker({ position, map });
      }

      if (center) {
        const position = new kakao.maps.LatLng(center.lat, center.lng);
        bounds.extend(position);
        new kakao.maps.CustomOverlay({
          position,
          map,
          zIndex: 5,
          content: chip(centerLabel, "center"),
        });
      }

      map.setBounds(bounds);
      setReady("kakao");
    });

    return () => {
      cancelled = true;
    };
  }, [pins, center, centerLabel]);

  if (pins.length === 0) {
    return (
      <div className="card grid h-44 place-items-center p-5 text-center text-[13.5px] text-ink-soft">
        아직 위치를 알려준 사람이 없어요.
        <br />
        투표할 때 출발지를 같이 남겨주시면 여기 지도에 모여요.
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={holder}
        className="h-64 w-full overflow-hidden rounded-[18px] border border-sand bg-white"
        style={{ display: ready === "kakao" ? "block" : "none" }}
      />
      {ready !== "kakao" && (
        <PlainMap pins={pins} center={center} centerLabel={centerLabel} />
      )}
    </div>
  );
}

function chip(label: string, kind: "person" | "me" | "center") {
  const style =
    kind === "center"
      ? "background:#3c8361;color:#fff;border-color:#2a5c45"
      : kind === "me"
        ? "background:#e8b85c;color:#4a370e;border-color:#d9a53f"
        : "background:#fff;color:#2b2b28;border-color:#ede4d3";
  return `<div style="${style};border-width:1px;border-style:solid;border-radius:999px;padding:2px 9px;font-size:12px;font-weight:600;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.12)">${escapeHtml(
    label,
  )}</div>`;
}

function escapeHtml(text: string) {
  return text.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c] as string,
  );
}

/** 지도 키가 없을 때 쓰는 위치 관계도. 방향과 거리 비율만 보여준다. */
function PlainMap({
  pins,
  center,
  centerLabel,
}: {
  pins: MapPin[];
  center: Point | null;
  centerLabel: string;
}) {
  const all = center ? [...pins, { ...center, label: centerLabel }] : pins;

  const lats = all.map((p) => p.lat);
  const lngs = all.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const spanLat = Math.max(maxLat - minLat, 0.004);
  const spanLng = Math.max(maxLng - minLng, 0.004);

  const W = 320;
  const H = 210;
  const PAD = 42;

  const place = (p: Point) => ({
    x: PAD + ((p.lng - minLng) / spanLng) * (W - PAD * 2),
    // 위도는 위로 갈수록 커지므로 y를 뒤집는다
    y: H - PAD - ((p.lat - minLat) / spanLat) * (H - PAD * 2),
  });

  const mid = center ? place(center) : null;

  return (
    <div className="overflow-hidden rounded-[18px] border border-sand bg-white">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full"
        role="img"
        aria-label="참가자 출발지와 중간 지점의 위치 관계도"
      >
        <defs>
          <pattern id="grid" width="26" height="26" patternUnits="userSpaceOnUse">
            <path
              d="M26 0H0v26"
              fill="none"
              stroke="#ede4d3"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="#fdfbf7" />
        <rect width={W} height={H} fill="url(#grid)" />

        {mid &&
          pins.map((pin) => {
            const p = place(pin);
            return (
              <line
                key={`l-${pin.label}-${pin.lat}-${pin.lng}`}
                x1={p.x}
                y1={p.y}
                x2={mid.x}
                y2={mid.y}
                stroke="#c9d8ce"
                strokeWidth="1.4"
                strokeDasharray="3 4"
                strokeLinecap="round"
              />
            );
          })}

        {pins.map((pin) => {
          const p = place(pin);
          return (
            <g key={`p-${pin.label}-${pin.lat}-${pin.lng}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r="6"
                fill={pin.isMe ? "#e8b85c" : "#fff"}
                stroke={pin.isMe ? "#c8942f" : "#3c8361"}
                strokeWidth="2"
              />
              <text
                x={p.x}
                y={p.y - 12}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="#2b2b28"
              >
                {pin.label}
              </text>
            </g>
          );
        })}

        {mid && (
          <g>
            <circle
              cx={mid.x}
              cy={mid.y}
              r="12"
              fill="#3c8361"
              opacity="0.14"
            />
            <circle cx={mid.x} cy={mid.y} r="6.5" fill="#3c8361" />
            <text
              x={mid.x}
              y={mid.y + 22}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill="#2a5c45"
            >
              {centerLabel}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
