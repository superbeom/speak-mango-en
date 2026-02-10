"use client";

import { useEffect, useState, memo, useMemo } from "react";
import { notFound, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import useSWR from "swr";
import { motion } from "framer-motion";
import { useI18n } from "@/context/I18nContext";
import { useConfirm } from "@/context/ConfirmContext";
import { useToast } from "@/context/ToastContext";
import { Expression } from "@/types/expression";
import { useLocalActionStore } from "@/store/useLocalActionStore";
import { usePaginationState } from "@/hooks/ui/usePaginationState";
import { useVocabularyView } from "@/hooks/user/useVocabularyView";
import { useBulkAction, BULK_ACTION_TYPE } from "@/hooks/user/useBulkAction";
import { getExpressionsByIds } from "@/services/queries/expressions";
import { EXPRESSION_PAGE_SIZE } from "@/constants/expressions";
import { ROUTES } from "@/lib/routes";
import { SkeletonVocabularyDetail } from "@/components/ui/Skeletons";
import Pagination from "@/components/ui/Pagination";
import VocabularyDetailHeader from "./VocabularyDetailHeader";
import VocabularyItemsGrid from "./VocabularyItemsGrid";
import VocabularyToolbar from "./VocabularyToolbar";

const BulkActionModalWrapper = dynamic(
  () => import("@/components/vocabulary/BulkActionModalWrapper"),
  { ssr: false },
);

interface LocalVocabularyDetailProps {
  listId: string;
}

const LocalVocabularyDetail = memo(function LocalVocabularyDetail({
  listId,
}: LocalVocabularyDetailProps) {
  const router = useRouter();
  const { dict } = useI18n();
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const {
    vocabularyLists,
    updateListTitle,
    deleteList,
    setDefaultList,
    addMultipleToList,
    removeMultipleFromList,
    _hasHydrated,
  } = useLocalActionStore();
  const {
    isSelectionMode,
    viewMode,
    selectedIds,
    toggleSelectionMode,
    toggleItem,
    selectAll,
    clearSelection,
    setViewMode,
  } = useVocabularyView();

  const [isDeleting, setIsDeleting] = useState(false); // 404 방지용 삭제 상태

  const {
    bulkAction: bulkActionState,
    openCopy: handleCopy,
    openMove: handleMove,
    close: closeBulkAction,
    onOpenChange: onBulkActionOpenChange,
  } = useBulkAction();

  // URL의 page 번호와 내부 상태 동기화
  const { page, handlePageChange: onPageChangeHandler } = usePaginationState();

  // 로컬 스토리지에서 현재 리스트 정보 가져오기
  const list = vocabularyLists[listId];
  const listTitle = list?.title || "";
  const totalCount = list?.itemIds.size || 0;
  const totalPages = Math.ceil(totalCount / EXPRESSION_PAGE_SIZE);

  // 현재 페이지에 해당하는 item ID들 계산 (Client Side Pagination of IDs)
  const currentPageIds = useMemo(() => {
    if (!list) return [];

    // Sort items by their timestamps (latest first)
    const allItemIds = Array.from(list.itemIds).sort((a, b) => {
      const tsA = list.itemTimestamps[a] || 0;
      const tsB = list.itemTimestamps[b] || 0;
      return tsB - tsA;
    });

    const startIdx = (page - 1) * EXPRESSION_PAGE_SIZE;
    const endIdx = startIdx + EXPRESSION_PAGE_SIZE;
    return allItemIds.slice(startIdx, endIdx);
  }, [list, page]);

  // SWR을 사용하여 ID들에 해당하는 Expression 데이터 가져오기
  const {
    data: items,
    isLoading: isSwrLoading,
    mutate,
  } = useSWR(
    currentPageIds.length > 0
      ? ["local-vocabulary", listId, currentPageIds]
      : null,
    () => getExpressionsByIds(currentPageIds),
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    },
  );

  const displayItems: Expression[] = items || [];
  const isLoading = (isSwrLoading && !items) || !_hasHydrated;

  // 리스트가 없으면 404 처리 (Hydration 완료 후)
  useEffect(() => {
    if (_hasHydrated && !list && !isDeleting) {
      notFound();
    }
  }, [_hasHydrated, list, isDeleting]);

  const handlePageChange = async (newPage: number) => {
    // 페이지 이동 시에는 스켈레톤을 보여주기 위해 현재 데이터를 비움
    await mutate(undefined, { revalidate: false });
    onPageChangeHandler(newPage);
  };

  const handleToggleAll = () => {
    if (selectedIds.size === displayItems.length) {
      clearSelection();
    } else {
      selectAll(displayItems.map((item) => item.id));
    }
  };

  const handleTitleSave = (newTitle: string) => {
    updateListTitle(listId, newTitle);
    showToast(dict.vocabulary.saveSuccess);
    mutate();
  };

  const handleListDelete = () => {
    setIsDeleting(true);
    router.replace(ROUTES.MY_PAGE);

    // Optimistic Navigation: 먼저 이동하고, 삭제는 나중에 처리하여 404 플리커링 방지
    setTimeout(() => {
      deleteList(listId);
      showToast(dict.vocabulary.deleteSuccess);
    }, 100);
  };

  const handleSetDefault = () => {
    setDefaultList(listId);
    showToast(dict.vocabulary.setDefaultSuccess);
    mutate();
  };

  const handleItemsDelete = () => {
    confirm({
      title: dict.vocabulary.delete,
      description: dict.vocabulary.itemsDeleteConfirm,
      onConfirm: async () => {
        removeMultipleFromList(listId, Array.from(selectedIds));
        showToast(dict.vocabulary.itemsDeleteSuccess);
        toggleSelectionMode();
      },
    });
  };

  if (isLoading || isDeleting) {
    return <SkeletonVocabularyDetail />;
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
          title={listTitle}
          itemCount={totalCount}
          isDefault={list?.isDefault}
          onTitleSave={handleTitleSave}
          onListDelete={handleListDelete}
          onSetDefault={handleSetDefault}
        />
      </div>

      <div className="mt-8 space-y-10">
        <VocabularyToolbar
          isSelectionMode={isSelectionMode}
          onToggleSelectionMode={toggleSelectionMode}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedCount={selectedIds.size}
          totalCount={totalCount}
          onToggleAll={handleToggleAll}
        />

        <VocabularyItemsGrid
          items={displayItems}
          isSelectionMode={isSelectionMode}
          viewMode={viewMode}
          selectedIds={selectedIds}
          onToggleItem={toggleItem}
          onCopy={handleCopy}
          onMove={handleMove}
          onDelete={handleItemsDelete}
        />

        {totalPages > 1 && (
          <div className="pagination-container">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              baseUrl={ROUTES.VOCABULARY_LIST(listId)}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      {bulkActionState && (
        <BulkActionModalWrapper
          isOpen={bulkActionState.isOpen}
          onOpenChange={onBulkActionOpenChange}
          type={bulkActionState.type}
          currentListId={listId}
          onSubmit={async (targetListId) => {
            const ids = Array.from(selectedIds);
            if (bulkActionState.type === BULK_ACTION_TYPE.COPY) {
              addMultipleToList(targetListId, ids);
              showToast(dict.vocabulary.copySuccess);
            } else {
              // bulkAction.type === BULK_ACTION_TYPE.MOVE
              addMultipleToList(targetListId, ids);
              removeMultipleFromList(listId, ids);
              showToast(dict.vocabulary.moveSuccess);
            }
            closeBulkAction();
            toggleSelectionMode();
            mutate(); // 로컬 스토리지 변경은 즉시 반영되지만, SWR 캐시 무효화를 위해 호출
          }}
        />
      )}
    </motion.div>
  );
});

LocalVocabularyDetail.displayName = "LocalVocabularyDetail";

export default LocalVocabularyDetail;
