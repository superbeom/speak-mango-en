// Google Analytics 4 (GA4) 분석 유틸리티 함수
// 타입 안전한 이벤트 추적 및 페이지 뷰 모니터링 제공

declare global {
  interface Window {
    gtag?: {
      (command: "js", date: Date): void;
      (command: "config", targetId: string, config?: Record<string, any>): void;
      (command: "event", eventName: string, params?: Record<string, any>): void;
    };
    dataLayer?: any[];
  }
}

// GA4 측정 ID (환경별 자동 선택)
const GA_MEASUREMENT_ID_DEV =
  process.env.NEXT_PUBLIC_DEV_GA_MEASUREMENT_ID || "";
const GA_MEASUREMENT_ID_PROD =
  process.env.NEXT_PUBLIC_PROD_GA_MEASUREMENT_ID || "";

export const GA_MEASUREMENT_ID =
  process.env.NODE_ENV === "production"
    ? GA_MEASUREMENT_ID_PROD
    : GA_MEASUREMENT_ID_DEV;

// 분석 기능 활성화 여부 확인
export const isAnalyticsEnabled = (): boolean => {
  return typeof window !== "undefined" && !!GA_MEASUREMENT_ID;
};

/**
 * Google Analytics 초기화
 * 앱 로드 시 한 번만 호출되어야 함
 */
export const initAnalytics = (): void => {
  if (!isAnalyticsEnabled()) {
    console.log(
      "[Analytics] Disabled in development or missing GA_MEASUREMENT_ID",
    );
    return;
  }

  // dataLayer 초기화
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer?.push(arguments);
  };

  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, {
    send_page_view: false, // 페이지 뷰는 수동으로 처리
  });

  console.log("[Analytics] Initialized with ID:", GA_MEASUREMENT_ID);
};

/**
 * 페이지 뷰 추적
 * @param path - 페이지 경로 (예: '/expressions/123')
 * @param title - 페이지 제목
 * @param lang - 현재 언어 (ko, en, ja 등)
 */
export const trackPageView = (
  path: string,
  title?: string,
  lang?: string,
): void => {
  if (!isAnalyticsEnabled()) {
    console.log("[Analytics] Page view:", { path, title, lang });
    return;
  }

  window.gtag?.("event", "page_view", {
    page_path: path,
    page_title: title,
    lang: lang,
  });
};

/**
 * 커스텀 이벤트 추적
 * @param eventName - 이벤트 이름 (예: 'expression_click')
 * @param properties - 이벤트 속성/파라미터
 */
export const trackEvent = (
  eventName: string,
  properties?: Record<string, any>,
): void => {
  if (!isAnalyticsEnabled()) {
    console.log("[Analytics] Event:", eventName, properties);
    return;
  }

  window.gtag?.("event", eventName, properties);
};

/**
 * 전환 이벤트 추적 (향후 수익화용)
 * @param type - 전환 유형 (예: 'feature_gate_view', 'payment_intent')
 * @param value - 선택적 금액 값
 * @param properties - 추가 속성
 */
export const trackConversion = (
  type: string,
  value?: number,
  properties?: Record<string, any>,
): void => {
  trackEvent("conversion", {
    conversion_type: type,
    value: value,
    ...properties,
  });
};

// 타입 안전성과 일관성을 위한 사전 정의된 이벤트 추적 함수

/**
 * 표현 조회 추적 (상세 페이지)
 */
export const trackExpressionView = (params: {
  expressionId: string;
  category: string;
  lang: string;
}): void => {
  trackEvent("expression_view", {
    expression_id: params.expressionId,
    category: params.category,
    lang: params.lang,
  });
};

/**
 * 표현 카드 클릭 추적
 */
export const trackExpressionClick = (params: {
  expressionId: string;
  expressionText: string;
  category: string;
  source: "home_feed" | "related" | "search";
}): void => {
  trackEvent("expression_click", {
    expression_id: params.expressionId,
    expression_text: params.expressionText,
    category: params.category,
    source: params.source,
  });
};

/**
 * 오디오 재생 추적
 */
export const trackAudioPlay = (params: {
  expressionId: string;
  audioIndex: number;
  playType: "individual" | "sequential";
}): void => {
  trackEvent("audio_play", {
    expression_id: params.expressionId,
    audio_index: params.audioIndex,
    play_type: params.playType,
  });
};

/**
 * 오디오 재생 완료 추적
 */
export const trackAudioComplete = (params: {
  expressionId: string;
  audioIndex: number;
}): void => {
  trackEvent("audio_complete", {
    expression_id: params.expressionId,
    audio_index: params.audioIndex,
  });
};

/**
 * 학습 모드 전환 추적
 */
export const trackLearningModeToggle = (params: {
  mode: "blind_listening" | "translation_blur";
  action: "enable" | "disable";
}): void => {
  trackEvent("learning_mode_toggle", {
    mode: params.mode,
    action: params.action,
  });
};

/**
 * 필터 적용 추적
 */
export const trackFilterApply = (params: {
  filterType: "category" | "tag" | "search";
  filterValue: string;
}): void => {
  trackEvent("filter_apply", {
    filter_type: params.filterType,
    filter_value: params.filterValue,
  });
};

/**
 * 검색 추적
 */
export const trackSearch = (params: { searchTerm: string }): void => {
  trackEvent("search", {
    search_term: params.searchTerm,
  });
};

/**
 * 태그 클릭 추적
 */
export const trackTagClick = (params: {
  tagName: string;
  source: "card" | "detail" | "filter";
}): void => {
  trackEvent("tag_click", {
    tag_name: params.tagName,
    source: params.source,
  });
};

/**
 * 관련 표현 클릭 추적
 */
export const trackRelatedClick = (params: {
  fromExpressionId: string;
  toExpressionId: string;
}): void => {
  trackEvent("related_click", {
    from_expression_id: params.fromExpressionId,
    to_expression_id: params.toExpressionId,
  });
};

/**
 * 공유 버튼 클릭 추적
 * Web Share API 사용 시 'native', 클립보드 복사 시 'clipboard'
 */
export const trackShareClick = (params: {
  expressionId: string;
  shareMethod: "native" | "copy_link";
  sharePlatform: "native" | "clipboard";
}): void => {
  trackEvent("share_click", {
    expression_id: params.expressionId,
    share_method: params.shareMethod,
    share_platform: params.sharePlatform,
  });
};
/**
 * 공유 완료 추적
 */
export const trackShareComplete = (params: {
  expressionId: string;
  sharePlatform: string;
}): void => {
  trackEvent("share_complete", {
    expression_id: params.expressionId,
    share_platform: params.sharePlatform,
  });
};

/**
 * 퀴즈 시작 추적
 */
export const trackQuizStart = (): void => {
  trackEvent("quiz_start", {});
};

/**
 * 퀴즈 정답 제출 추적
 */
export const trackQuizAnswer = (params: {
  expressionId: string;
  isCorrect: boolean;
  questionIndex: number;
}): void => {
  trackEvent("quiz_answer", {
    expression_id: params.expressionId,
    is_correct: params.isCorrect,
    question_index: params.questionIndex,
  });
};

/**
 * 퀴즈 완료 추적
 */
export const trackQuizComplete = (params: {
  score: number;
  totalQuestions: number;
}): void => {
  trackEvent("quiz_complete", {
    score: params.score,
    total_questions: params.totalQuestions,
  });
};
