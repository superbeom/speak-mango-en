"use client";

import { useEffect, useState, memo } from "react";
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
  // URL의 page 번호와 내부 상태 동기화
  const { page, handlePageChange: onPageChangeHandler } = usePaginationState();

  // 페이지 전환 중 스켈레톤 노출을 위한 상태
  const [isPageTransition, setIsPageTransition] = useState(false);

  const { data, isLoading: isSwrLoading } = useSWR(
    ["learned-expressions", page],
    () => getLearnedListDetails(page, EXPRESSION_PAGE_SIZE),
    {
      fallbackData:
        page === initialPage
          ? {
              id: "learned",
              title: dict.me.learnedExpressions,
              is_default: false,
              created_at: "",
              total_count: initialTotalCount,
              items: initialItems,
            }
          : undefined,
      keepPreviousData: true,
      revalidateOnFocus: false,
    },
  );

  useEffect(() => {
    if (data && !isSwrLoading) {
      setIsPageTransition(false);
    }
  }, [data, isSwrLoading]);

  const displayItems = data?.items || [];
  const displayTotalCount = data?.total_count || 0;
  const totalPages = Math.ceil(displayTotalCount / EXPRESSION_PAGE_SIZE);
  const isLoading = (isSwrLoading && !data) || isPageTransition;

  const handlePageChange = (newPage: number) => {
    // 페이지 이동 시에는 스켈레톤을 보여주기 위해
    setIsPageTransition(true);
    onPageChangeHandler(newPage, { scroll: false });
  };

  if (isLoading) {
    return <SkeletonVocabularyDetail />;
  }

  return (
    <motion.div
      key={`learned-${page}`}
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

RemoteLearnedDetail.displayName = "RemoteLearnedDetail";

export default RemoteLearnedDetail;
