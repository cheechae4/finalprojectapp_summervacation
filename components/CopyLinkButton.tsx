"use client";

import { useState } from "react";

export default function CopyLinkButton({
  url,
  label = "링크 복사",
}: {
  url: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // 클립보드 권한이 없으면 사용자가 직접 복사하도록 선택만 해준다
      window.prompt("아래 주소를 복사해서 공유하세요", url);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button type="button" onClick={copy} className="btn-primary w-full">
      {copied ? "복사했어요" : label}
    </button>
  );
}
