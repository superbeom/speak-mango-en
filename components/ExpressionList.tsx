"use client";

import { useI18n } from "@/context/I18nContext";
import { Expression } from "@/types/database";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import { serializeFilters } from "@/lib/utils";
import { ExpressionFilters } from "@/services/queries/expressions";
import { SkeletonExpressionList } from "./ui/Skeletons";
import AnimatedList from "./AnimatedList";
import ExpressionCard from "./ExpressionCard";
import LoadMoreButton from "./LoadMoreButton";

interface ExpressionListProps {
  initialItems: Expression[];
  filters: ExpressionFilters;
}

export default function ExpressionList({
  initialItems,
  filters,
}: ExpressionListProps) {
  const { locale, dict } = useI18n();
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
              className="content-visibility-auto"
            />
          ))}
        </AnimatedList>

        {/* 로딩 중일 때 스켈레톤 카드 3개 표시 */}
        {loading && <SkeletonExpressionList />}
      </div>

      {hasMore && !loading && (
        <LoadMoreButton onClick={loadMore} label={dict.common.loadMore} />
      )}
    </div>
  );
}
