"use client";

import { useState, useEffect, memo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import useSWR, { useSWRConfig } from "swr";
import { useVocabularyStore } from "@/store/useVocabularyStore";
import { motion } from "framer-motion";
import { useI18n } from "@/context/I18nContext";
import { useConfirm } from "@/context/ConfirmContext";
import { useToast } from "@/context/ToastContext";
import { Expression } from "@/types/expression";
import { useAppErrorHandler } from "@/hooks/useAppErrorHandler";
import { usePaginationState } from "@/hooks/ui/usePaginationState";
import { useVocabularyView } from "@/hooks/user/useVocabularyView";
import { useBulkAction, BULK_ACTION_TYPE } from "@/hooks/user/useBulkAction";
import { EXPRESSION_PAGE_SIZE } from "@/constants/expressions";
import {
  getVocabularyListDetails,
  getVocabularyLists,
} from "@/services/queries/vocabulary";
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
import VocabularyDetailHeader from "./VocabularyDetailHeader";
import VocabularyItemsGrid from "./VocabularyItemsGrid";
import VocabularyToolbar from "./VocabularyToolbar";

const BulkActionModalWrapper = dynamic(
  () => import("@/components/vocabulary/BulkActionModalWrapper"),
  { ssr: false },
);

interface RemoteVocabularyDetailProps {
  listId: string;
  title: string;
  items: Expression[];
  isDefault: boolean;
  totalCount: number;
  currentPage: number;
}

const RemoteVocabularyDetail = memo(function RemoteVocabularyDetail({
  listId,
  title: initialTitle,
  items: initialItems,
  isDefault: initialIsDefault,
  totalCount: initialTotalCount,
  currentPage: initialPage,
}: RemoteVocabularyDetailProps) {
  const router = useRouter();
  const { dict } = useI18n();
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const { handleError } = useAppErrorHandler();

  // URL의 내부 상태 동기화
  const { handlePageChange: onPageChangeHandler } = usePaginationState();

  // Fetch data using SWR for caching
  const {
    data,
    mutate,
    isLoading: isSwrLoading,
    isValidating,
  } = useSWR(
    ["vocabulary-details", listId, initialPage],
    () => getVocabularyListDetails(listId, initialPage, EXPRESSION_PAGE_SIZE),
    {
      fallbackData: {
        id: listId,
        title: initialTitle,
        items: initialItems,
        is_default: initialIsDefault,
        total_count: initialTotalCount,
        created_at: new Date().toISOString(),
      },
      keepPreviousData: true,
      revalidateOnFocus: false,
      revalidateOnMount: true, // Router Cache로 인한 stale props 방지
    },
  );

  const { mutate: globalMutate } = useSWRConfig();

  // Zustand 스토어에서 최신 리스트 메타 정보를 구독
  // (클라이언트 사이드 네비게이션 시에도 즉시 정확한 데이터 반영)
  const storeList = useVocabularyStore((state) =>
    state.lists.find((l) => l.id === listId),
  );

  // 초기값 우선순위: Zustand 스토어(즉시) > 서버 props
  // SWR fallbackData(Router Cache에 의해 stale할 수 있음)는 의도적으로 제외
  const [title, setTitle] = useState(storeList?.title ?? initialTitle);
  const [isDefault, setIsDefault] = useState(
    storeList?.is_default ?? initialIsDefault,
  );

  // 스토어가 갱신되면 로컬 상태에 반영 (SWR → syncWithServer → 스토어 → 여기)
  // 낙관적 업데이트 중에는 스킵하여 optimistic 값 보호
  useEffect(() => {
    if (storeList && useVocabularyStore.getState()._pendingOps === 0) {
      setTitle(storeList.title);
      setIsDefault(storeList.is_default);
    }
  }, [storeList?.title, storeList?.is_default]);

  // items는 SWR에서만 (전체 Expression 객체는 스토어 범위 밖)
  // total_count는 스토어 우선 (optimisticToggle에서 이미 갱신됨)
  const displayItems: Expression[] = data?.items || [];
  const displayTotalCount = storeList?.item_count ?? data?.total_count ?? 0;
  const totalPages = Math.ceil(displayTotalCount / EXPRESSION_PAGE_SIZE);
  const isLoading = isSwrLoading && !data;

  // SWR이 백그라운드에서 리페치 중이고, 스토어 카운트와 표시 아이템 수가 다르면
  // items가 stale일 수 있으므로 미묘한 로딩 힌트 표시
  const isRefreshing =
    isValidating && displayItems.length !== displayTotalCount;

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
    onPageChangeHandler(newPage);
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
    // Zustand 스토어 낙관적 업데이트 (_pendingOps++)
    useVocabularyStore.getState().optimisticUpdateTitle(listId, newTitle);

    try {
      await updateVocabularyListTitle(listId, newTitle);
      mutate(); // 현재 리스트 상세 SWR 갱신
      useVocabularyStore.getState().resolveOperation();
      // 스토어의 최신 데이터를 SWR 캐시에 즉시 반영 (무효화만 하면 stale 데이터가 스토어를 덮어씀)
      globalMutate(
        "vocabulary_lists",
        useVocabularyStore.getState().lists,
        false,
      );
      showToast(dict.vocabulary.saveSuccess);
    } catch (error) {
      setTitle(previousTitle);
      useVocabularyStore.getState().resolveOperation();
      globalMutate(
        "vocabulary_lists",
        useVocabularyStore.getState().lists,
        false,
      );
      handleError(error);
    }
  };

  const handleSetDefault = async () => {
    const previous = isDefault;
    setIsDefault(true);
    // Zustand 스토어 낙관적 업데이트 (_pendingOps++)
    useVocabularyStore.getState().optimisticSetDefault(listId);

    try {
      await setDefaultVocabularyList(listId);
      mutate(); // 현재 리스트 상세 SWR 갱신

      // setDefault는 서버 부수 효과 없음 (is_default 플래그만 토글)
      // → 낙관적 데이터가 정확하므로 서버 재조회 불필요
      useVocabularyStore.getState().resolveOperation();
      globalMutate(
        "vocabulary_lists",
        useVocabularyStore.getState().lists,
        false,
      );
      showToast(dict.vocabulary.setDefaultSuccess);

      // 다른 모든 단어장 상세 페이지 캐시 무효화
      globalMutate(
        (key) =>
          Array.isArray(key) &&
          key[0] === "vocabulary-details" &&
          key[1] !== listId,
        undefined,
        { revalidate: true },
      );
    } catch (error) {
      setIsDefault(previous);
      useVocabularyStore.getState().resolveOperation();
      globalMutate(
        "vocabulary_lists",
        useVocabularyStore.getState().lists,
        false,
      );
      handleError(error);
    }
  };

  const handleListDelete = async () => {
    // Zustand 스토어 낙관적 업데이트 (_pendingOps++)
    useVocabularyStore.getState().optimisticDeleteList(listId);

    try {
      await deleteVocabularyList(listId);

      // DB 트리거가 새 디폴트를 설정했으므로, 최신 데이터를 받아와 스토어 + SWR 캐시 동기화
      const freshLists = await getVocabularyLists();
      useVocabularyStore.getState().resolveOperation(freshLists);
      globalMutate("vocabulary_lists", freshLists, false); // 다른 페이지의 SWR 캐시도 갱신
      showToast(dict.vocabulary.deleteSuccess);
      router.push(ROUTES.MY_PAGE);
    } catch (error) {
      const rollbackLists = await getVocabularyLists().catch(() => undefined);
      useVocabularyStore.getState().resolveOperation(rollbackLists);
      globalMutate(
        "vocabulary_lists",
        useVocabularyStore.getState().lists,
        false,
      );
      handleError(error);
    }
  };

  const handleItemsDelete = () => {
    confirm({
      title: dict.vocabulary.delete,
      description: dict.vocabulary.itemsDeleteConfirm,
      onConfirm: async () => {
        try {
          const deletedCount = selectedIds.size;
          await removeExpressionsFromVocabularyList(
            listId,
            Array.from(selectedIds),
          );
          mutate(); // 현재 리스트 상세 SWR 갱신

          // 스토어 item_count 즉시 반영 + SWR 캐시 동기화
          const updatedLists = useVocabularyStore.getState().lists.map((l) =>
            l.id === listId
              ? {
                  ...l,
                  item_count: Math.max(0, (l.item_count || 0) - deletedCount),
                }
              : l,
          );
          useVocabularyStore.getState().setLists(updatedLists);
          globalMutate("vocabulary_lists", updatedLists, false);

          showToast(dict.vocabulary.itemsDeleteSuccess);
          toggleSelectionMode();
        } catch (error) {
          handleError(error);
        }
      },
    });
  };

  if (isLoading) {
    return <SkeletonVocabularyDetail showToolbar />;
  }

  return (
    <motion.div
      key={`${listId}-${initialPage}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="py-8"
    >
      <div className="layout-container">
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

        <div
          className={`transition-opacity duration-300 ${
            isRefreshing ? "opacity-50 pointer-events-none" : "opacity-100"
          }`}
        >
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
        </div>

        {totalPages > 1 && (
          <div className="pagination-container">
            <Pagination
              currentPage={initialPage}
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
            try {
              const isCopy = bulkActionState.type === BULK_ACTION_TYPE.COPY;
              if (isCopy) {
                await copyExpressionsToVocabularyList(targetListId, ids);
              } else {
                await moveExpressionsToVocabularyList(
                  listId,
                  targetListId,
                  ids,
                );
              }
              mutate(); // 현재 리스트 상세 SWR 갱신

              // 스토어 item_count 즉시 반영 + SWR 캐시 동기화
              const itemCount = ids.length;
              const updatedLists = useVocabularyStore
                .getState()
                .lists.map((l) => {
                  if (l.id === targetListId) {
                    return {
                      ...l,
                      item_count: (l.item_count || 0) + itemCount,
                    };
                  }
                  if (!isCopy && l.id === listId) {
                    return {
                      ...l,
                      item_count: Math.max(0, (l.item_count || 0) - itemCount),
                    };
                  }
                  return l;
                });
              useVocabularyStore.getState().setLists(updatedLists);
              globalMutate("vocabulary_lists", updatedLists, false);

              showToast(
                isCopy
                  ? dict.vocabulary.copySuccess
                  : dict.vocabulary.moveSuccess,
              );
              closeBulkAction();
              toggleSelectionMode();
            } catch (error) {
              handleError(error); // 1. 사용자에게 에러 토스트를 보여줍니다.
              throw error; // 2. BulkVocabularyListModal에게 실패를 알려 로딩 상태(isSubmitting)를 해제하게 합니다.
            }
          }}
        />
      )}
    </motion.div>
  );
});

RemoteVocabularyDetail.displayName = "RemoteVocabularyDetail";

export default RemoteVocabularyDetail;
