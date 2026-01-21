"use client";

import { Expression } from "@/types/database";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
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
  const cacheKey = serializeFilters(filters);

  // 로케일을 포함한 필터 (페이지네이션 시 사용)
  const filtersWithLocale = { ...filters, locale };

  // 1. 페이지네이션 데이터 관리
  const { items, hasMore, loading, loadMore } = usePaginatedList({
    initialItems,
    filters: filtersWithLocale,
    cacheKey,
  });

  // 2. 스크롤 추적 및 복원
  useScrollRestoration({ cacheKey });

  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <AnimatedList>
          {items.map((item) => (
            <ExpressionCard
              key={item.id}
              item={item}
              locale={locale}
              className="content-visibility-auto"
            />
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
