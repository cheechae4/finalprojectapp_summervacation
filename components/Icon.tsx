/**
 * 손으로 그린 듯한 느낌의 작은 아이콘들.
 * 선을 둥글게 끝맺고 굵기를 얇게 잡아서 딱딱하지 않게 보이도록 했다.
 */

type IconName =
  | "pin"
  | "clock"
  | "people"
  | "check"
  | "link"
  | "map"
  | "target"
  | "walk";

const PATHS: Record<IconName, React.ReactNode> = {
  pin: (
    <>
      <path d="M12 21c3.6-4.2 6-7.2 6-10a6 6 0 1 0-12 0c0 2.8 2.4 5.8 6 10Z" />
      <circle cx="12" cy="11" r="2.2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 19c.6-3 2.9-4.6 5.5-4.6s4.9 1.6 5.5 4.6" />
      <path d="M16 6.2a3.2 3.2 0 0 1 .3 6.2M17.4 14.8c2 .5 3.4 1.9 3.9 4.2" />
    </>
  ),
  check: <path d="M5 12.6 9.6 17 19 7.4" />,
  link: (
    <>
      <path d="M10.4 13.6a3.6 3.6 0 0 0 5.2.3l2.6-2.6a3.7 3.7 0 0 0-5.2-5.2l-1.5 1.5" />
      <path d="M13.6 10.4a3.6 3.6 0 0 0-5.2-.3l-2.6 2.6a3.7 3.7 0 0 0 5.2 5.2l1.5-1.5" />
    </>
  ),
  map: (
    <>
      <path d="M3.5 6.6 9 4.5l6 2.4 5.5-2.1v12.6L15 19.5l-6-2.4-5.5 2.1V6.6Z" />
      <path d="M9 4.5v12.6M15 6.9v12.6" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.6v2.4M12 19v2.4M2.6 12H5M19 12h2.4" />
    </>
  ),
  walk: (
    <>
      <circle cx="13" cy="4.8" r="1.9" />
      <path d="M11.4 21l1.4-5.6-2.5-2.2.9-4.6 3.2 1.4 2.4 2.6" />
      <path d="M10.2 9.2 7.4 11l-.9 3.4M12.8 15.4 15.6 21" />
    </>
  ),
};

export default function Icon({
  name,
  size = 18,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
