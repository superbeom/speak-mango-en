"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/analytics";

/**
 * AnalyticsProvider
 *
 * 라우트 변경 시 자동으로 페이지 뷰를 추적합니다.
 * 이 컴포넌트는 루트 레이아웃에 배치되어야 합니다.
 */
export default function AnalyticsProvider({
  children,
  lang,
}: {
  children: React.ReactNode;
  lang?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 라우트 변경 시 페이지 뷰 추적
    const url =
      pathname +
      (searchParams?.toString() ? `?${searchParams.toString()}` : "");

    // Next.js 메타데이터가 document.title을 설정할 때까지 대기
    // 이를 통해 분석에서 올바른 제목을 캡처할 수 있음
    const timer = setTimeout(() => {
      trackPageView(url, document.title, lang);
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname, searchParams, lang]);

  return <>{children}</>;
}
