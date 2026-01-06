"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Expression } from "@/types/database";
import { useExpressionStore } from "@/context/ExpressionContext";
import { fetchMoreExpressions } from "@/lib/actions";
import { serializeFilters } from "@/lib/utils";
import { ExpressionFilters } from "@/lib/expressions";
import { SkeletonCard } from "./ui/Skeletons";
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
  const { cache, updateCacheData, updateScrollPosition } = useExpressionStore();

  // 1. 캐시 키 생성 및 저장된 상태 확인
  // 부모(Home)에서 filters를 기반으로 'key' prop을 주입하므로,
  // 필터가 변경되면 이 컴포넌트는 완전히 언마운트 후 새로 마운트됩니다.
  const cacheKey = serializeFilters(filters);
  const cachedState = cache[cacheKey];

  // 2. 초기 상태 설정
  // 캐시된 데이터가 있다면 즉시 초기값으로 사용하여 첫 렌더링부터 올바른 DOM 높이를 확보합니다.
  // 이는 브라우저가 스크롤 위치를 복원할 수 있는 물리적 공간을 만드는데 필수적입니다.
  const [items, setItems] = useState<Expression[]>(
    cachedState ? cachedState.items : initialItems
  );
  const [page, setPage] = useState(cachedState ? cachedState.page : 1);
  const [hasMore, setHasMore] = useState(
    cachedState ? cachedState.hasMore : initialItems.length >= 12
  );
  const [loading, setLoading] = useState(false);

  // 스크롤 복원 작업이 진행 중인지 여부를 추적합니다.
  // 복원 도중에 현재 위치(보통 0)를 캐시에 저장하여 이전 위치를 날려버리는 것을 방지합니다.
  const isRestored = useRef(false);

  // 3. 실시간 스크롤 위치 저장 (Throttled)
  // 상세 페이지 이동뿐만 아니라 브라우저 뒤로가기 등 모든 상황에 대응하기 위해 실시간으로 추적합니다.
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      // 스크롤 복원이 완료된 후에만 현재 위치를 캐시에 기록합니다.
      if (!isRestored.current) return;

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        updateScrollPosition(cacheKey, window.scrollY);
      }, 200); // 잦은 업데이트를 방지하기 위해 200ms 디바운스 적용
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [cacheKey, updateScrollPosition]);

  // 4. 상태 저장 (데이터 변경 시점)
  // '더 보기' 등으로 아이템이 추가될 때마다 캐시를 업데이트합니다.
  // 이때 스크롤 위치는 건드리지 않고 데이터(items, page)만 부분 업데이트합니다.
  useEffect(() => {
    if (items.length > 0) {
      updateCacheData(cacheKey, {
        items,
        page,
        hasMore,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, page, hasMore, cacheKey]);

  // 5. 스크롤 복원 (재귀적 RAF 방식)
  // 레이아웃이 잡히고 브라우저가 페인팅을 완료할 때까지 여러 프레임에 걸쳐 스크롤 이동을 시도합니다.
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const targetPosition = cachedState?.scrollPosition || 0;

    // 브라우저의 기본 스크롤 복원 기능과 충돌하지 않도록 수동(manual) 모드로 설정합니다.
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    if (targetPosition <= 0) {
      isRestored.current = true;
      return;
    }

    let rafId: number;
    let attempts = 0;
    const maxAttempts = 60; // 약 1초(60fps 기준) 동안 복원을 시도합니다.

    const performScroll = () => {
      window.scrollTo(0, targetPosition);

      attempts++;
      // 목표 위치에 도달했거나 시도 횟수를 초초과하면 종료합니다.
      if (
        Math.abs(window.scrollY - targetPosition) < 5 ||
        attempts >= maxAttempts
      ) {
        // 복원 완료 표시 (약간의 유예 시간을 두어 스크롤 이벤트가 무시되도록 함)
        setTimeout(() => {
          isRestored.current = true;
        }, 100);
        return;
      }

      rafId = requestAnimationFrame(performScroll);
    };

    rafId = requestAnimationFrame(performScroll);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    const nextPage = page + 1;

    try {
      const nextItems = await fetchMoreExpressions(filters, nextPage);

      if (nextItems && nextItems.length > 0) {
        const newItems = [...items, ...nextItems];
        const newHasMore = nextItems.length >= 12;

        setItems(newItems);
        setPage(nextPage);
        setHasMore(newHasMore);
      } else {
        setHasMore(false);
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
