"use client";

import { useState, useEffect, useLayoutEffect } from "react";
import { Expression } from "@/types/database";
import { fetchMoreExpressions } from "@/lib/actions";
import { ExpressionFilters } from "@/lib/expressions";
import { SkeletonCard } from "./ui/Skeletons";
import { useExpressionStore } from "@/context/ExpressionContext";
import AnimatedList from "./AnimatedList";
import ExpressionCard from "./ExpressionCard";
import LoadMoreButton from "./LoadMoreButton";

interface ExpressionListProps {
  initialItems: Expression[];
  filters: ExpressionFilters;
  locale: string;
  loadMoreText: string;
}

export default function ExpressionList({
  initialItems,
  filters,
  locale,
  loadMoreText,
}: ExpressionListProps) {
  const { state, setState, updateState } = useExpressionStore();

  // 1. 초기 상태 결정 로직 (동기적)
  // 필터가 같고 스토어에 데이터가 있다면 스토어 데이터를 사용해 초기 렌더링 시점부터 DOM 높이를 확보합니다.
  const shouldUseStore =
    JSON.stringify(state.filters) === JSON.stringify(filters) &&
    state.items.length > 0;

  const [items, setItems] = useState<Expression[]>(
    shouldUseStore ? state.items : initialItems
  );
  const [page, setPage] = useState(shouldUseStore ? state.page : 1);
  const [hasMore, setHasMore] = useState(
    shouldUseStore ? state.hasMore : initialItems.length >= 12
  );
  const [loading, setLoading] = useState(false);

  // 2. 스토어 상태 동기화 및 초기화
  useEffect(() => {
    // 스토어 데이터와 현재 props가 다르면(새로운 검색/필터 등), 스토어를 초기화합니다.
    if (!shouldUseStore) {
      setState({
        items: initialItems,
        page: 1,
        hasMore: initialItems.length >= 12,
        filters: filters,
        scrollPosition: 0,
      });
      // 로컬 상태도 props로 동기화
      setItems(initialItems);
      setPage(1);
      setHasMore(initialItems.length >= 12);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, initialItems]);

  // 3. 스크롤 위치 저장 및 복원
  useEffect(() => {
    // 컴포넌트 언마운트 시(상세 페이지 이동 등) 현재 스크롤 위치 저장
    return () => {
      updateState({ scrollPosition: window.scrollY });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    // 데이터 복원 모드이고 저장된 스크롤 위치가 있다면 복원 시도
    // 브라우저의 자동 복원(history)이 실패하거나 동작하지 않을 경우를 대비
    if (shouldUseStore && state.scrollPosition > 0) {
      window.scrollTo(0, state.scrollPosition);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    const nextPage = page + 1;

    try {
      const nextItems = await fetchMoreExpressions(filters, nextPage);

      if (nextItems && nextItems.length > 0) {
        const newItems = [...items, ...nextItems];
        const newHasMore = nextItems.length >= 12; // 가져온 개수가 12개 미만이면 다음 데이터는 없음

        // 로컬 상태 업데이트
        setItems(newItems);
        setPage(nextPage);
        setHasMore(newHasMore);

        // 스토어 상태 업데이트
        updateState({
          items: newItems,
          page: nextPage,
          hasMore: newHasMore,
        });
      } else {
        setHasMore(false);
        updateState({ hasMore: false });
      }
    } catch (error) {
      console.error("Failed to load more items:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <AnimatedList>
          {items.map((item) => (
            <ExpressionCard key={item.id} item={item} locale={locale} />
          ))}
        </AnimatedList>

        {/* 로딩 중일 때 스켈레톤 카드 3개 표시 */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={`skeleton-${i}`} />
            ))}
          </div>
        )}
      </div>

      {hasMore && !loading && (
        <LoadMoreButton onClick={loadMore} label={loadMoreText} />
      )}
    </div>
  );
}
