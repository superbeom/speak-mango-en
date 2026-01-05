"use client";

import { useState, useEffect } from "react";
import { Expression } from "@/types/database";
import { fetchMoreExpressions } from "@/lib/actions";
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
  const [items, setItems] = useState<Expression[]>(initialItems);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  // 초기 로드된 개수가 limit(12)보다 적으면 다음 페이지가 없는 것으로 간주
  const [hasMore, setHasMore] = useState(initialItems.length >= 12);

  // 검색어나 카테고리 등 필터가 변경되어 서버에서 새로운 initialItems를 내려주면 리스트 초기화
  useEffect(() => {
    setItems(initialItems);
    setPage(1);
    setHasMore(initialItems.length >= 12);
  }, [initialItems]);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    const nextPage = page + 1;

    try {
      const nextItems = await fetchMoreExpressions(filters, nextPage);

      if (nextItems && nextItems.length > 0) {
        setItems((prev) => [...prev, ...nextItems]);
        setPage(nextPage);
        // 가져온 개수가 12개 미만이면 다음 데이터는 없음
        if (nextItems.length < 12) {
          setHasMore(false);
        }
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
