"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { trackPageView } from "@/lib/analytics";

/**
 * 구글 애널리틱스(GA4). NEXT_PUBLIC_GA_ID 가 없으면 아무것도 넣지 않는다.
 */
export default function Analytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID?.trim();
  if (!id) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga-setup" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
window.gtag=gtag;
gtag('js',new Date());
gtag('config','${id}');`}
      </Script>
      <Suspense fallback={null}>
        <RouteChange />
      </Suspense>
    </>
  );
}

/**
 * 앱 안에서 화면을 옮길 때는 페이지가 새로 열리지 않아서
 * 조회수가 안 잡힌다. 주소가 바뀔 때마다 직접 알려준다.
 */
function RouteChange() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    trackPageView(query ? `${pathname}?${query}` : pathname);
  }, [pathname, searchParams]);

  return null;
}
