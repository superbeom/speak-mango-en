"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from "react";

/**
 * 필터 조합별로 저장될 리스트의 상태 구조입니다.
 * SWR 도입으로 데이터(items)는 SWR 캐시가 관리하므로,
 * 여기서는 복원을 위한 메타데이터(페이지 수, 스크롤 위치)만 관리합니다.
 */
export interface ExpressionState {
  size: number; // SWRInfinite의 페이지 수 (몇 페이지까지 로드했는지)
  scrollPosition: number;
}

interface ExpressionContextType {
  // 필터 키(string)별로 상태를 저장하는 중앙 캐시 객체
  cache: Record<string, ExpressionState>;
  // 특정 필터 키의 상태를 전체 업데이트
  setCache: (key: string, state: ExpressionState) => void;
  // 스크롤 위치를 제외한 데이터(페이지 수)만 부분 업데이트
  updateCacheData: (key: string, data: { size: number }) => void;
  // 특정 필터 키의 스크롤 위치만 최신화
  updateScrollPosition: (key: string, position: number) => void;
  // 저장된 캐시 조회
  getCache: (key: string) => ExpressionState | undefined;
}

const ExpressionContext = createContext<ExpressionContextType | undefined>(
  undefined,
);

export function ExpressionProvider({ children }: { children: ReactNode }) {
  const [cache, setCacheState] = useState<Record<string, ExpressionState>>({});

  /**
   * 캐시 전체를 설정합니다.
   * 리렌더링 최적화를 위해 useCallback을 사용합니다.
   */
  const setCache = useCallback((key: string, state: ExpressionState) => {
    setCacheState((prev) => ({
      ...prev,
      [key]: state,
    }));
  }, []);

  /**
   * 스크롤 위치는 그대로 둔 채, 로드된 페이지 수(size)만 업데이트합니다.
   * '더 보기' 버튼 클릭 시 호출됩니다.
   */
  const updateCacheData = useCallback((key: string, data: { size: number }) => {
    setCacheState((prev) => {
      const currentState = prev[key];
      const currentScroll = currentState ? currentState.scrollPosition : 0;

      // 최적화: 변경이 없으면 업데이트 건너뜀
      if (currentState && currentState.size === data.size) {
        return prev;
      }

      return {
        ...prev,
        [key]: {
          size: data.size,
          scrollPosition: currentScroll,
        },
      };
    });
  }, []);

  /**
   * 스크롤 위치만 따로 저장합니다.
   * 실시간 스크롤 리스너에서 호출되며, 리스트 데이터 유실을 방지하기 위해
   * 상태가 없을 경우 기본값(1페이지)으로 초기화합니다.
   */
  const updateScrollPosition = useCallback((key: string, position: number) => {
    setCacheState((prev) => {
      const currentState = prev[key];

      if (!currentState) {
        return {
          ...prev,
          [key]: {
            size: 1, // 기본값: 1페이지
            scrollPosition: position,
          },
        };
      }

      // 최적화: 위치 변화가 미미하거나 같으면 업데이트 건너뜀
      if (Math.abs(currentState.scrollPosition - position) < 1) {
        return prev;
      }

      return {
        ...prev,
        [key]: {
          ...currentState,
          scrollPosition: position,
        },
      };
    });
  }, []);

  const getCache = useCallback(
    (key: string) => {
      return cache[key];
    },
    [cache],
  );

  /**
   * 컨텍스트 제공 값을 메모이제이션하여
   * 이를 소비하는 컴포넌트(ExpressionList 등)의 불필요한 리렌더링을 방지합니다.
   */
  const value = useMemo(
    () => ({
      cache,
      setCache,
      updateCacheData,
      updateScrollPosition,
      getCache,
    }),
    [cache, setCache, updateCacheData, updateScrollPosition, getCache],
  );

  return (
    <ExpressionContext.Provider value={value}>
      {children}
    </ExpressionContext.Provider>
  );
}

export function useExpressionStore() {
  const context = useContext(ExpressionContext);
  if (!context) {
    throw new Error(
      "useExpressionStore must be used within an ExpressionProvider",
    );
  }
  return context;
}
