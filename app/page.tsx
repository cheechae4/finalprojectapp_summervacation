import Link from "next/link";

const STEPS = [
  {
    title: "모임을 만들어요",
    body: "이름, 목적, 필요한 시간, 후보 시간대를 적으면 끝이에요.",
  },
  {
    title: "링크를 보내요",
    body: "받은 사람은 가입 없이 이름만 적고 바로 투표할 수 있어요.",
  },
  {
    title: "언제 만날지 정리해줘요",
    body: "가능한 사람 수와 모임 목적을 같이 따져서 시간을 골라줘요.",
  },
];

export default function Home() {
  return (
    <div className="pt-6">
      <h1 className="text-[30px] font-bold leading-tight tracking-tight">
        우리 모임에 맞는
        <br />
        시간을 찾아보세요
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
        언제 다들 되는지 물어보다가 흐지부지되는 일, 여기서 끝내요. 목적까지
        보고 정리해드려요.
      </p>

      <Link href="/create" className="btn-primary mt-6 w-full">
        모임 만들기
      </Link>
      <p className="mt-2.5 text-center text-[13px] text-ink-soft">
        로그인 없이 바로 시작할 수 있어요
      </p>

      <ol className="mt-10 space-y-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="card flex gap-3.5 p-4">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-green-soft text-[13px] font-semibold text-green-dark">
              {i + 1}
            </span>
            <div>
              <p className="text-[15px] font-semibold">{step.title}</p>
              <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink-soft">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
