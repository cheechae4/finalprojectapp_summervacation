"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { gaId, gtmId, trackPageView } from "@/lib/analytics";

/**
 * 측정 도구를 붙인다. 둘 중 아무것도 안 넣으면 스크립트 자체가 들어가지 않는다.
 * - NEXT_PUBLIC_GA_ID  : 구글 애널리틱스(GA4)를 직접 붙일 때
 * - NEXT_PUBLIC_GTM_ID : 구글 태그매니저를 통해 붙일 때
 */
export default function Analytics() {
  const ga = gaId();
  const gtm = gtmId();

  if (!ga && !gtm) return null;

  return (
    <>
      {gtm && (
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtm}');`}
        </Script>
      )}

      {ga && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}
            strategy="afterInteractive"
          />
          <Script id="ga-setup" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
window.gtag=gtag;
gtag('js',new Date());
gtag('config','${ga}');`}
          </Script>
        </>
      )}

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

/** 자바스크립트가 꺼진 브라우저용. 태그매니저를 쓸 때만 body 맨 앞에 들어간다. */
export function GtmNoScript() {
  const gtm = process.env.NEXT_PUBLIC_GTM_ID?.trim();
  if (!gtm) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtm}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
