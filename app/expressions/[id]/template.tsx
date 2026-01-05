"use client";

import { useEffect } from "react";

export default function Template({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 템플릿은 페이지 이동 시마다 새롭게 마운트되므로,
    // 이곳에 스크롤 리셋 로직을 두면 프레임워크 수준에서 매번 실행됩니다.
    window.scrollTo(0, 0);
  }, []);

  return <>{children}</>;
}
