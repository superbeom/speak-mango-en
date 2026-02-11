"use client";

import { memo } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import { useI18n } from "@/context/I18nContext";
import { Expression } from "@/types/expression";
import { usePaginationState } from "@/hooks/ui/usePaginationState";
import { VIEW_MODE } from "@/constants/ui";
import { EXPRESSION_PAGE_SIZE } from "@/constants/expressions";
import { getLearnedListDetails } from "@/services/queries/vocabulary";
import { ROUTES } from "@/lib/routes";
import { SkeletonVocabularyDetail } from "@/components/ui/Skeletons";
import Pagination from "@/components/ui/Pagination";
import VocabularyDetailHeader from "@/components/me/vocabulary/VocabularyDetailHeader";
import VocabularyItemsGrid from "@/components/me/vocabulary/VocabularyItemsGrid";

interface RemoteLearnedDetailProps {
  initialItems: Expression[];
  initialTotalCount: number;
  currentPage: number;
}

const RemoteLearnedDetail = memo(function RemoteLearnedDetail({
  initialItems,
  initialTotalCount,
  currentPage: initialPage,
}: RemoteLearnedDetailProps) {
  const { dict } = useI18n();
  // URL의 내부 상태 동기화
  const { handlePageChange: onPageChangeHandler } = usePaginationState();

  const { data, isLoading: isSwrLoading } = useSWR(
    ["learned-expressions", initialPage],
    () => getLearnedListDetails(initialPage, EXPRESSION_PAGE_SIZE),
    {
      fallbackData: {
        id: "learned",
        title: dict.me.learnedExpressions,
        is_default: false,
        created_at: "",
        total_count: initialTotalCount,
        items: initialItems,
      },
      keepPreviousData: true,
      revalidateOnFocus: false,
    },
  );

  const displayItems = data?.items || [];
  const displayTotalCount = data?.total_count || 0;
  const totalPages = Math.ceil(displayTotalCount / EXPRESSION_PAGE_SIZE);
  const isLoading = isSwrLoading && !data;

  const handlePageChange = (newPage: number) => {
    onPageChangeHandler(newPage);
  };

  if (isLoading) {
    return <SkeletonVocabularyDetail readonly />;
  }

  return (
    <motion.div
      key={`learned-${initialPage}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="py-8"
    >
      <div className="layout-container">
        <VocabularyDetailHeader
          title={dict.me.learnedExpressions}
          itemCount={displayTotalCount}
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
        />

        {totalPages > 1 && (
          <div className="pagination-container">
            <Pagination
              currentPage={initialPage}
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

RemoteLearnedDetail.displayName = "RemoteLearnedDetail";

export default RemoteLearnedDetail;
