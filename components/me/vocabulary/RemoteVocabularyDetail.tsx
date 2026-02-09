"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { motion } from "framer-motion";
import { useI18n } from "@/context/I18nContext";
import { useConfirm } from "@/context/ConfirmContext";
import { useToast } from "@/context/ToastContext";
import { Expression } from "@/types/expression";
import { useAppErrorHandler } from "@/hooks/useAppErrorHandler";
import { useVocabularyView } from "@/hooks/user/useVocabularyView";
import { useBulkAction, BULK_ACTION_TYPE } from "@/hooks/user/useBulkAction";
import { EXPRESSION_PAGE_SIZE } from "@/constants/expressions";
import { getVocabularyListDetails } from "@/services/queries/vocabulary";
import {
  updateVocabularyListTitle,
  deleteVocabularyList,
  setDefaultVocabularyList,
  copyExpressionsToVocabularyList,
  moveExpressionsToVocabularyList,
  removeExpressionsFromVocabularyList,
} from "@/services/actions/vocabulary";
import { ROUTES } from "@/lib/routes";
import { SkeletonVocabularyDetail } from "@/components/ui/Skeletons";
import Pagination from "@/components/ui/Pagination";
import BulkActionModalWrapper from "@/components/vocabulary/BulkActionModalWrapper";
import VocabularyDetailHeader from "./VocabularyDetailHeader";
import VocabularyItemsGrid from "./VocabularyItemsGrid";
import VocabularyToolbar from "./VocabularyToolbar";

interface RemoteVocabularyDetailProps {
  listId: string;
  title: string;
  items: Expression[];
  isDefault: boolean;
  totalCount: number;
  currentPage: number;
}

export default function RemoteVocabularyDetail({
  listId,
  title: initialTitle,
  items: initialItems,
  isDefault: initialIsDefault,
  totalCount: initialTotalCount,
  currentPage: initialPage,
}: RemoteVocabularyDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dict } = useI18n();
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const { handleError } = useAppErrorHandler();

  // URL의 page 번호와 내부 상태 동기화
  const pageFromUrl = Number(searchParams.get("page")) || 1;
  const [page, setPage] = useState(pageFromUrl);

  useEffect(() => {
    setPage(pageFromUrl);
  }, [pageFromUrl]);

  // Fetch data using SWR for caching
  const {
    data,
    mutate,
    isLoading: isSwrLoading,
  } = useSWR(
    ["vocabulary-details", listId, page],
    () => getVocabularyListDetails(listId, page, EXPRESSION_PAGE_SIZE),
    {
      fallbackData:
        page === initialPage
          ? {
              id: listId,
              title: initialTitle,
              items: initialItems,
              is_default: initialIsDefault,
              total_count: initialTotalCount,
              created_at: new Date().toISOString(),
            }
          : undefined,
      keepPreviousData: true,
      revalidateOnFocus: false,
    },
  );

  // Local state for optimistic updates (Title, Default)
  const [title, setTitle] = useState(data?.title || initialTitle);
  const [isDefault, setIsDefault] = useState(
    data?.is_default ?? initialIsDefault,
  );

  // 페이지 전환 중 스켈레톤 노출을 위한 상태
  const [isPageTransition, setIsPageTransition] = useState(false);

  const displayItems = data?.items || [];
  const displayTotalCount = data?.total_count || 0;
  const isLoading = (isSwrLoading && !data) || isPageTransition;

  // 데이터 로딩이 완료되면 페이지 전환 상태 해제
  useEffect(() => {
    if (data && !isSwrLoading) {
      setIsPageTransition(false);
    }
  }, [data, isSwrLoading]);

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

  const {
    bulkAction: bulkActionState,
    openCopy: handleCopy,
    openMove: handleMove,
    close: closeBulkAction,
    onOpenChange: onBulkActionOpenChange,
  } = useBulkAction();

  const handlePageChange = (newPage: number) => {
    // 페이지 이동 시에는 스켈레톤을 보여주기 위해
    setIsPageTransition(true);

    setPage(newPage);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());

    router.push(`${ROUTES.VOCABULARY_LIST(listId)}?${params.toString()}`, {
      scroll: false,
    });
  };

  const handleToggleAll = () => {
    if (selectedIds.size === displayItems.length) {
      clearSelection();
    } else {
      selectAll(displayItems.map((item) => item.id));
    }
  };

  const handleTitleSave = async (newTitle: string) => {
    const previousTitle = title;
    setTitle(newTitle);

    try {
      await updateVocabularyListTitle(listId, newTitle);
      showToast(dict.vocabulary.saveSuccess);
      mutate(); // 데이터 일관성을 위해 갱신
    } catch (error) {
      setTitle(previousTitle);
      handleError(error);
    }
  };

  const handleSetDefault = async () => {
    const previous = isDefault;
    setIsDefault(true);
    try {
      await setDefaultVocabularyList(listId);
      showToast(dict.vocabulary.setDefaultSuccess);
      mutate(); // 데이터 일관성을 위해 갱신
    } catch (error) {
      setIsDefault(previous);
      handleError(error);
    }
  };

  const handleListDelete = async () => {
    try {
      await deleteVocabularyList(listId);
      showToast(dict.vocabulary.deleteSuccess);
      router.push(ROUTES.MY_PAGE);
    } catch (error) {
      handleError(error);
    }
  };

  const handleItemsDelete = () => {
    confirm({
      title: dict.vocabulary.delete,
      description: dict.vocabulary.itemsDeleteConfirm,
      onConfirm: async () => {
        try {
          await removeExpressionsFromVocabularyList(
            listId,
            Array.from(selectedIds),
          );
          showToast(dict.vocabulary.itemsDeleteSuccess);
          toggleSelectionMode();
          mutate(); // 데이터 일관성을 위해 갱신
        } catch (error) {
          handleError(error);
        }
      },
    });
  };

  if (isLoading) {
    return <SkeletonVocabularyDetail />;
  }

  return (
    <motion.div
      key={`${listId}-${page}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="py-8"
    >
      <div className="max-w-layout mx-auto px-4 sm:px-6 lg:px-8">
        <VocabularyDetailHeader
          title={title}
          itemCount={displayTotalCount}
          isDefault={isDefault}
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
          totalCount={displayItems.length}
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

        <Pagination
          currentPage={page}
          totalPages={Math.ceil(displayTotalCount / EXPRESSION_PAGE_SIZE)}
          baseUrl={ROUTES.VOCABULARY_LIST(listId)}
          onPageChange={handlePageChange}
        />
      </div>

      {bulkActionState && (
        <BulkActionModalWrapper
          isOpen={bulkActionState.isOpen}
          onOpenChange={onBulkActionOpenChange}
          type={bulkActionState.type}
          currentListId={listId}
          onSubmit={async (targetListId) => {
            const ids = Array.from(selectedIds);
            try {
              if (bulkActionState.type === BULK_ACTION_TYPE.COPY) {
                await copyExpressionsToVocabularyList(targetListId, ids);
              } else {
                await moveExpressionsToVocabularyList(
                  listId,
                  targetListId,
                  ids,
                );
              }
              showToast(
                bulkActionState.type === BULK_ACTION_TYPE.COPY
                  ? dict.vocabulary.copySuccess
                  : dict.vocabulary.moveSuccess,
              );
              closeBulkAction();
              toggleSelectionMode();
              mutate(); // 복사/이동 후 목록 갱신!
            } catch (error) {
              handleError(error); // 1. 사용자에게 에러 토스트를 보여줍니다.
              throw error; // 2. BulkVocabularyListModal에게 실패를 알려 로딩 상태(isSubmitting)를 해제하게 합니다.
            }
          }}
        />
      )}
    </motion.div>
  );
}
