// Analytics utility functions for Google Analytics 4 (GA4)
// This module provides type-safe event tracking and page view monitoring

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

// GA4 Measurement ID (environment-based selection)
const GA_MEASUREMENT_ID_DEV =
  process.env.NEXT_PUBLIC_DEV_GA_MEASUREMENT_ID || "";
const GA_MEASUREMENT_ID_PROD =
  process.env.NEXT_PUBLIC_PROD_GA_MEASUREMENT_ID || "";

export const GA_MEASUREMENT_ID =
  process.env.NODE_ENV === "production"
    ? GA_MEASUREMENT_ID_PROD
    : GA_MEASUREMENT_ID_DEV;

// Check if analytics is enabled
export const isAnalyticsEnabled = (): boolean => {
  return typeof window !== "undefined" && !!GA_MEASUREMENT_ID;
};

/**
 * Initialize Google Analytics
 * This should be called once when the app loads
 */
export const initAnalytics = (): void => {
  if (!isAnalyticsEnabled()) {
    console.log(
      "[Analytics] Disabled in development or missing GA_MEASUREMENT_ID"
    );
    return;
  }

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer?.push(arguments);
  };

  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, {
    send_page_view: false, // We'll handle page views manually
  });

  console.log("[Analytics] Initialized with ID:", GA_MEASUREMENT_ID);
};

/**
 * Track a page view
 * @param path - The page path (e.g., '/expressions/123')
 * @param title - The page title
 * @param lang - Current language (ko, en, ja, etc.)
 */
export const trackPageView = (
  path: string,
  title?: string,
  lang?: string
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
 * Track a custom event
 * @param eventName - Name of the event (e.g., 'expression_click')
 * @param properties - Event properties/parameters
 */
export const trackEvent = (
  eventName: string,
  properties?: Record<string, any>
): void => {
  if (!isAnalyticsEnabled()) {
    console.log("[Analytics] Event:", eventName, properties);
    return;
  }

  window.gtag?.("event", eventName, properties);
};

/**
 * Track a conversion event (for future monetization)
 * @param type - Conversion type (e.g., 'feature_gate_view', 'payment_intent')
 * @param value - Optional monetary value
 * @param properties - Additional properties
 */
export const trackConversion = (
  type: string,
  value?: number,
  properties?: Record<string, any>
): void => {
  trackEvent("conversion", {
    conversion_type: type,
    value: value,
    ...properties,
  });
};

// Predefined event tracking functions for type safety and consistency

/**
 * Track expression view (detail page)
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
 * Track expression card click
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
 * Track audio playback
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
 * Track audio playback completion
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
 * Track learning mode toggle
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
 * Track filter application
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
 * Track search
 */
export const trackSearch = (params: {
  searchTerm: string;
  resultsCount: number;
}): void => {
  trackEvent("search", {
    search_term: params.searchTerm,
    results_count: params.resultsCount,
  });
};

/**
 * Track tag click
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
 * Track related expression click
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

// Future: Social share tracking
/**
 * Track share button click (to be implemented)
 */
export const trackShareClick = (params: {
  expressionId: string;
  shareMethod: "native" | "button" | "copy_link";
  sharePlatform: "twitter" | "facebook" | "kakaotalk" | "clipboard";
}): void => {
  trackEvent("share_click", {
    expression_id: params.expressionId,
    share_method: params.shareMethod,
    share_platform: params.sharePlatform,
  });
};

/**
 * Track share completion (to be implemented)
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
