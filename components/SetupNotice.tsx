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
        표는 만들어졌어도, 앱이 어느 프로젝트로 접속할지는 따로 알려줘야 해요.
        아래 칸이 비어 있어요.
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
      <p className="mt-2.5 text-[13px] leading-relaxed text-ink">
        값은 Supabase 대시보드 <b>Settings → API</b>에 있어요. Project URL과
        anon public key를 복사해서 넣어주세요.
      </p>
      <ul className="mt-1.5 space-y-0.5 text-[13px] leading-relaxed text-ink-soft">
        <li>내 컴퓨터에서 볼 때는 프로젝트 폴더의 .env.local 파일</li>
        <li>
          배포한 주소에서 볼 때는 Vercel의 Settings → Environment Variables (넣은
          뒤 Redeploy까지)
        </li>
      </ul>
    </div>
  );
}
