"use client";

import { memo, useMemo } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import { useI18n } from "@/context/I18nContext";
import { Expression } from "@/types/expression";
import { useLocalActionStore } from "@/store/useLocalActionStore";
import { usePaginationState } from "@/hooks/ui/usePaginationState";
import { getExpressionsByIds } from "@/services/queries/expressions";
import { VIEW_MODE } from "@/constants/ui";
import { EXPRESSION_PAGE_SIZE } from "@/constants/expressions";
import { ROUTES } from "@/lib/routes";
import { SkeletonVocabularyDetail } from "@/components/ui/Skeletons";
import Pagination from "@/components/ui/Pagination";
import VocabularyDetailHeader from "@/components/me/vocabulary/VocabularyDetailHeader";
import VocabularyItemsGrid from "@/components/me/vocabulary/VocabularyItemsGrid";

const LocalLearnedDetail = memo(function LocalLearnedDetail() {
  const { dict } = useI18n();
  const { getActions, _hasHydrated } = useLocalActionStore();

  // URL의 page 번호와 내부 상태 동기화
  const { page, handlePageChange: onPageChangeHandler } = usePaginationState();

  // 로컬 스토리지에서 학습된 아이템 ID 가져오기
  const learnedIds = useMemo(
    () => getActions("learn"),
    [_hasHydrated, getActions],
  );
  const totalCount = learnedIds.length;
  const totalPages = Math.ceil(totalCount / EXPRESSION_PAGE_SIZE);

  // 현재 페이지에 해당하는 item ID들 계산 (Client Side Pagination of IDs)
  const currentPageIds = useMemo(() => {
    const startIdx = (page - 1) * EXPRESSION_PAGE_SIZE;
    const endIdx = startIdx + EXPRESSION_PAGE_SIZE;
    return learnedIds.slice(startIdx, endIdx);
  }, [learnedIds, page]);

  // SWR을 사용하여 ID들에 해당하는 Expression 데이터 가져오기
  const {
    data: items,
    isLoading: isSwrLoading,
    mutate,
  } = useSWR(
    currentPageIds.length > 0 ? ["local-learned", currentPageIds] : null,
    () => getExpressionsByIds(currentPageIds),
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    },
  );

  const displayItems: Expression[] = items || [];
  const isLoading = (isSwrLoading && !items) || !_hasHydrated;

  const handlePageChange = async (newPage: number) => {
    // 페이지 이동 시에는 스켈레톤을 보여주기 위해 현재 데이터를 비움
    await mutate(undefined, { revalidate: false });
    onPageChangeHandler(newPage);
  };

  if (isLoading) {
    return <SkeletonVocabularyDetail readonly />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="py-8"
    >
      <div className="layout-container">
        <VocabularyDetailHeader
          title={dict.me.learnedExpressions}
          itemCount={totalCount}
          readonly
        />
      </div>

      <div className="mt-8 space-y-10">
        <VocabularyItemsGrid
          items={displayItems}
          isSelectionMode={false}
          viewMode={VIEW_MODE.FULL}
          selectedIds={new Set()}
          onToggleItem={() => {}}
          emptyMessage={dict.me.noLearnedExpressions}
          emptyDescription={dict.me.learnExpressionsToSee}
        />

        {totalPages > 1 && (
          <div className="pagination-container">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              baseUrl={ROUTES.LEARNED}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
});

LocalLearnedDetail.displayName = "LocalLearnedDetail";

export default LocalLearnedDetail;
