import { createClient } from "@supabase/supabase-js";

// 값이 아예 없을 때뿐 아니라 빈 문자열일 때도 "없음"으로 본다.
// Vercel에서 변수만 만들고 값을 비워두면 빈 문자열이 들어온다.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || undefined;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || undefined;

export const supabaseConfigured = Boolean(url && anonKey);

if (!supabaseConfigured) {
  console.warn(
    "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 가 없습니다. 환경변수를 확인하세요.",
  );
}

// 값이 없어도 빌드는 통과해야 해서 자리표시자를 넣는다. 실제 호출은 실패한다.
export const supabase = createClient(
  url ?? "https://placeholder.supabase.co",
  anonKey ?? "placeholder-anon-key",
  { auth: { persistSession: false } },
);
