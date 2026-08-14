import type { Metadata, Viewport } from "next";
import Link from "next/link";
import Analytics, { GtmNoScript } from "@/components/Analytics";
import SetupNotice from "@/components/SetupNotice";
import "./globals.css";

export const metadata: Metadata = {
  title: "모임픽 — 우리 모임에 맞는 시간 찾기",
  description:
    "모임 목적과 참석자 일정을 모아서 언제 만날지 정해주는 서비스. 로그인 없이 링크만 공유하면 됩니다.",
  openGraph: {
    title: "모임픽",
    description: "우리 모임에 딱 맞는 시간과 장소를 찾아보세요.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#3c8361",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body>
        <GtmNoScript />
        <div className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col px-5">
          <header className="py-5">
            <Link
              href="/"
              className="text-[17px] font-bold tracking-tight text-green-dark"
            >
              모임픽
            </Link>
          </header>
          <main className="flex-1 pb-16">
            <SetupNotice />
            {children}
          </main>
          <footer className="border-t border-sand py-6 text-[13px] text-ink-soft">
            로그인 없이 링크만으로 쓰는 모임 조율 서비스
          </footer>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
