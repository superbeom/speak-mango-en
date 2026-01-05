"use client";

import { useSyncExternalStore } from "react";

/**
 * 미디어 쿼리 문자열과 일치하는지 여부를 반환하는 커스텀 훅.
 * React 18의 useSyncExternalStore를 사용하여 외부 소스(Media Query)와 동기화합니다.
 * SSR 호환성을 위해 초기값은 undefined를 반환합니다.
 *
 * @param query 매칭할 미디어 쿼리 문자열 (예: "(max-width: 768px)")
 * @returns {boolean | undefined} 일치 여부 (초기값: undefined)
 */
export function useMediaQuery(query: string): boolean | undefined {
  const subscribe = (callback: () => void) => {
    const media = window.matchMedia(query);
    media.addEventListener("change", callback);
    return () => media.removeEventListener("change", callback);
  };

  const getSnapshot = () => {
    return window.matchMedia(query).matches;
  };

  const getServerSnapshot = () => {
    return undefined;
  };

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
