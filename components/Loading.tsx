export default function Loading({ label = "불러오는 중" }: { label?: string }) {
  return (
    <p className="dots flex items-center pt-10 text-[14px] text-ink-soft">
      {label}
      <span />
      <span />
      <span />
    </p>
  );
}
