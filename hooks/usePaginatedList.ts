"use client";

import { useCallback, useEffect } from "react";
import useSWRInfinite from "swr/infinite";
import { Expression } from "@/types/database";
import { useExpressionStore } from "@/context/ExpressionContext";
import { fetchMoreExpressions } from "@/lib/actions";
import { ExpressionFilters } from "@/lib/expressions";

interface UsePaginatedListProps {
  initialItems: Expression[];
  filters: ExpressionFilters;
  cacheKey: string;
}

/**
 * 페이지네이션(더 보기) 된 리스트 데이터를 관리하고 전역 캐시와 동기화하는 커스텀 훅입니다.
 * useSWRInfinite를 사용하여 데이터 페칭, 캐싱, 상태 관리를 자동화했습니다.
 * ExpressionContext는 '페이지 수(size)'와 '스크롤 위치'만 관리하여 뒤로가기 시 복원을 돕습니다.
 */
export function usePaginatedList({
  initialItems,
  filters,
  cacheKey,
}: UsePaginatedListProps) {
  const { cache, updateCacheData } = useExpressionStore();
  const cachedState = cache[cacheKey];

  // 1. SWR 키 생성 함수
  // 각 페이지별로 고유한 키를 생성합니다. null 반환 시 요청을 중단합니다.
  const getKey = (pageIndex: number, previousPageData: Expression[] | null) => {
    // 이전 페이지 데이터가 비어있다면 더 이상 요청하지 않음 (끝 도달)
    if (previousPageData && !previousPageData.length) return null;

    // 키 구성: [식별자, 필터(문자열), 페이지번호]
    // filters 객체 참조 변경으로 인한 불필요한 리렌더링/요청 방지를 위해 직렬화(JSON.stringify)합니다.
    return ["ExpressionList", JSON.stringify(filters), pageIndex + 1];
  };

  // 2. Data Fetcher
  const fetcher = async ([_, currentFilters, page]: [
    string,
    ExpressionFilters,
    number,
  ]) => {
    return await fetchMoreExpressions(currentFilters, page);
  };

  // 3. useSWRInfinite 설정
  const { data, size, setSize, isLoading } = useSWRInfinite(getKey, fetcher, {
    // 초기 데이터 설정 (SSR/ISR 데이터 활용)
    // 캐시된 페이지 수(size)만큼 데이터를 미리 확보하는 로직은 fallback으로 처리하거나
    // SWR이 첫 페이지만 initialData로 쓰고 나머지는 revalidate하는 방식을 따릅니다.
    // 여기서는 첫 페이지만 initialData로 설정합니다.
    fallbackData: [initialItems],
    // 뒤로가기 시 이전에 보던 페이지 수만큼 복원
    initialSize: cachedState ? cachedState.size : 1,
    // 포커스 시 불필요한 자동 갱신 방지 (리스트가 너무 자주 바뀌면 사용자 경험 저하)
    revalidateOnFocus: false,
    // 첫 페이지는 항상 초기 데이터가 있으므로 마운트 시 불필요한 재검증 방지
    revalidateFirstPage: false,
  });

  // 4. 데이터 가공 (2차원 배열 -> 1차원 배열)
  const items = data ? data.flat() : initialItems;

  const isEmpty = data?.[0]?.length === 0;
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.length < 12);
  const loadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");

  // 5. 캐시 동기화 (Data Persistence)
  // 페이지 수(size)가 변경될 때마다 전역 컨텍스트 캐시를 업데이트합니다.
  useEffect(() => {
    updateCacheData(cacheKey, { size });
  }, [size, cacheKey, updateCacheData]);

  // 6. 더 보기 함수
  const loadMore = useCallback(() => {
    if (loadingMore || isReachingEnd) return;
    setSize(size + 1);
  }, [loadingMore, isReachingEnd, size, setSize]);

  return {
    items,
    hasMore: !isReachingEnd,
    loading: loadingMore,
    loadMore,
  };
}
