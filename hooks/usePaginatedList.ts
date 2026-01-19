"use client";

import { useState, useEffect, useCallback } from "react";
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
 * 초기 데이터 및 필터 정보를 받아 아이템 목록, 다음 페이지 존재 여부, 로딩 상태를 관리하며
 * 데이터 변경 시마다 해당 필터(cacheKey)에 해당하는 전역 상태를 업데이트합니다.
 */
export function usePaginatedList({
  initialItems,
  filters,
  cacheKey,
}: UsePaginatedListProps) {
  const { cache, updateCacheData } = useExpressionStore();
  const cachedState = cache[cacheKey];

  // 1. 초기 상태 설정
  // 이전 방문 기억(캐시)이 있다면 이를 우선 사용하고, 없다면 서버에서 받은 초기 데이터를 사용합니다.
  const [items, setItems] = useState<Expression[]>(
    cachedState ? cachedState.items : initialItems,
  );
  const [page, setPage] = useState(cachedState ? cachedState.page : 1);
  const [hasMore, setHasMore] = useState(
    cachedState ? cachedState.hasMore : initialItems.length >= 12,
  );
  const [loading, setLoading] = useState(false);

  // 2. 캐시 동기화 (Data Persistence)
  // 리스트 항목이나 페이지 번호가 변경될 때마다 전역 컨텍스트 캐시를 업데이트하여
  // 상세 페이지 이동 후 돌아왔을 때 현재의 리스트 상태를 그대로 복원할 수 있게 합니다.
  useEffect(() => {
    if (items.length > 0) {
      updateCacheData(cacheKey, {
        items,
        page,
        hasMore,
      });
    }
  }, [items, page, hasMore, cacheKey, updateCacheData]);

  /**
   * 추가 데이터를 페칭하고 상태를 업데이트하는 함수입니다.
   */
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    const nextPage = page + 1;

    try {
      // 서버 액션을 호출하여 다음 페이지 데이터를 가져옵니다.
      const nextItems = await fetchMoreExpressions(filters, nextPage);

      if (nextItems && nextItems.length > 0) {
        // 기존 목록 뒤에 새로운 항목들을 추가합니다.
        setItems((prev) => [...prev, ...nextItems]);
        setPage(nextPage);
        // 가져온 데이터가 한 페이지 분량(12개) 미만이면 더 이상 데이터가 없다고 판단합니다.
        setHasMore(nextItems.length >= 12);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more items:", error);
    } finally {
      setLoading(false); // 로딩 상태 해제
    }
  }, [
    loading,
    hasMore,
    page,
    filters,
    setItems,
    setPage,
    setHasMore,
    setLoading,
  ]);

  return {
    items,
    hasMore,
    loading,
    loadMore,
  };
}
