/**
 * 환경변수가 아직 안 들어간 상태에서 배포하면, 화면이 그냥 안 되는 대신
 * 무엇이 빠졌는지 알려준다. 값이 다 있으면 아무것도 그리지 않는다.
 */
export default function SetupNotice() {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
    missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  if (missing.length === 0) return null;

  return (
    <div className="mb-5 rounded-[16px] border border-coral bg-coral-soft p-4">
      <p className="text-[14px] font-semibold text-coral">
        아직 데이터베이스가 연결되지 않았어요
      </p>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink">
        모임을 만들거나 투표하려면 Supabase 값이 필요해요. Vercel 프로젝트의
        Settings → Environment Variables에 아래 값을 넣고 다시 배포해주세요.
      </p>
      <ul className="mt-2 space-y-1">
        {missing.map((key) => (
          <li
            key={key}
            className="rounded-[8px] bg-white/70 px-2.5 py-1 font-mono text-[12px] break-all"
          >
            {key}
          </li>
        ))}
      </ul>
    </div>
  );
}
