"use client";

import { useEffect } from "react";
import { trackExpressionView } from "@/analytics";

interface ExpressionViewTrackerProps {
  expressionId: string;
  category: string;
  lang: string;
}

/**
 * ExpressionViewTracker
 *
 * 표현 상세 페이지가 로드될 때 expression_view 이벤트를 추적합니다.
 * 서버 렌더링된 상세 페이지를 감싸는 클라이언트 컴포넌트입니다.
 */
export default function ExpressionViewTracker({
  expressionId,
  category,
  lang,
}: ExpressionViewTrackerProps) {
  useEffect(() => {
    trackExpressionView({
      expressionId,
      category,
      lang,
    });
  }, [expressionId, category, lang]);

  return null;
}
