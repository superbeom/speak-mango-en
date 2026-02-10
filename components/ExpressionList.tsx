"use client";

import { useMemo, useEffect } from "react";
import { useI18n } from "@/context/I18nContext";
import { useExpressionStore } from "@/context/ExpressionContext";
import { Expression } from "@/types/database";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import { usePaginatedList } from "@/hooks/ui/usePaginatedList";
import { EXPRESSION_SORT } from "@/constants/expressions";
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
  const { randomSeed, setRandomSeed } = useExpressionStore();

  // 1. 시드 안정화 로직
  const effectiveSeed = useMemo(() => {
    if (filters.sort !== EXPRESSION_SORT.RANDOM) return undefined;
    return randomSeed || filters.seed;
  }, [filters.sort, filters.seed, randomSeed]);

  // 2. 최초 진입 시 시드 저장
  useEffect(() => {
    if (
      filters.sort === EXPRESSION_SORT.RANDOM &&
      !randomSeed &&
      filters.seed
    ) {
      setRandomSeed(filters.seed);
    }
  }, [filters.sort, filters.seed, randomSeed, setRandomSeed]);

  // 3. 초기 데이터 불일치 처리
  const isSeedMismatched =
    filters.sort === EXPRESSION_SORT.RANDOM &&
    randomSeed &&
    randomSeed !== filters.seed;
  const effectiveInitialItems = isSeedMismatched ? [] : initialItems;

  // filters 객체 참조 안정화를 위해 useMemo 사용
  // SWR이 불필요하게 키가 변경되었다고 인식하여 재요청하는 것을 방지합니다.
  const filtersWithLocale = useMemo(
    () => ({
      ...filters,
      seed: effectiveSeed,
      locale,
    }),
    [filters, effectiveSeed, locale],
  );

  const cacheKey = serializeFilters(filtersWithLocale);

  // 4. 페이지네이션 데이터 관리
  const { items, hasMore, loading, loadMore } = usePaginatedList({
    initialItems: effectiveInitialItems,
    filters: filtersWithLocale,
    cacheKey,
  });

  // 데이터 복원 중인지 확인 (랜덤 모드에서 시드가 다르면서 데이터가 아직 없는 경우)
  const isRestoring =
    filters.sort === EXPRESSION_SORT.RANDOM && items.length === 0;

  // 5. 스크롤 추적 및 복원
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

        {/* 로딩 중이거나 복원 중일 때 스켈레톤 카드 3개 표시 */}
        {(loading || isRestoring) && <SkeletonExpressionList />}
      </div>

      {hasMore && !loading && !isRestoring && (
        <LoadMoreButton onClick={loadMore} label={dict.common.loadMore} />
      )}
    </div>
  );
}
