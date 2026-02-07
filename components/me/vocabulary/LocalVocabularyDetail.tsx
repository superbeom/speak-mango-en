"use client";

import { useEffect, useState, memo } from "react";
import { notFound, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useI18n } from "@/context/I18nContext";
import { useConfirm } from "@/context/ConfirmContext";
import { useToast } from "@/context/ToastContext";
import { Expression } from "@/types/expression";
import { useLocalActionStore } from "@/store/useLocalActionStore";
import { useVocabularyView } from "@/hooks/user/useVocabularyView";
import { useBulkAction, BULK_ACTION_TYPE } from "@/hooks/user/useBulkAction";
import { getExpressionsByIds } from "@/services/queries/expressions";
import { ROUTES } from "@/lib/routes";
import {
  SkeletonExpressionList,
  SkeletonVocabularyDetailHeader,
  SkeletonVocabularyToolbar,
} from "@/components/ui/Skeletons";
import BulkActionModalWrapper from "@/components/vocabulary/BulkActionModalWrapper";
import VocabularyDetailHeader from "./VocabularyDetailHeader";
import VocabularyItemsGrid from "./VocabularyItemsGrid";
import VocabularyToolbar from "./VocabularyToolbar";

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

  const [listTitle, setListTitle] = useState("");
  const [items, setItems] = useState<Expression[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // 404 방지용 삭제 상태

  const {
    bulkAction: bulkActionState,
    openCopy: handleCopy,
    openMove: handleMove,
    close: closeBulkAction,
    onOpenChange: onBulkActionOpenChange,
  } = useBulkAction();

  const handleToggleAll = () => {
    if (selectedIds.size === items.length) {
      clearSelection();
    } else {
      selectAll(items.map((item) => item.id));
    }
  };

  const handleTitleSave = (newTitle: string) => {
    setListTitle(newTitle);
    updateListTitle(listId, newTitle);
    showToast(dict.vocabulary.saveSuccess);
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
  };

  const handleItemsDelete = () => {
    confirm({
      title: dict.vocabulary.delete,
      description: dict.vocabulary.itemsDeleteConfirm,
      onConfirm: () => {
        removeMultipleFromList(listId, Array.from(selectedIds));
        showToast(dict.vocabulary.itemsDeleteSuccess);
        toggleSelectionMode();
      },
    });
  };

  useEffect(() => {
    let isMounted = true;

    // Wait for hydration
    if (!_hasHydrated) return;

    const fetchList = async () => {
      const list = vocabularyLists[listId];

      if (!list) {
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
        return;
      }

      if (isMounted) {
        setListTitle(list.title);
        if (list.itemIds.size === 0) {
          setItems([]);
          setLoading(false);
          return;
        }
      }

      try {
        const expressionIds = Array.from(list.itemIds);
        const fetchedItems = await getExpressionsByIds(expressionIds);

        if (!isMounted) return;

        setItems(fetchedItems);
      } catch (err) {
        if (isMounted) {
          console.error("Failed to fetch local list items:", err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchList();

    return () => {
      isMounted = false;
    };
  }, [listId, vocabularyLists, _hasHydrated]);

  // 삭제 중일 때는 에러(NotFound)를 무시함
  if (error && !isDeleting) {
    notFound();
    return null;
  }

  if (loading || !_hasHydrated) {
    return (
      <div className="py-8 animate-pulse">
        <div className="max-w-layout mx-auto px-4 sm:px-6 lg:px-8">
          <SkeletonVocabularyDetailHeader />
        </div>

        <div className="mt-8 space-y-10 max-w-layout mx-auto px-4 sm:px-6 lg:px-8">
          <SkeletonVocabularyToolbar />
          <SkeletonExpressionList />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="py-8"
    >
      <div className="max-w-layout mx-auto px-4 sm:px-6 lg:px-8">
        <VocabularyDetailHeader
          title={listTitle}
          itemCount={items.length}
          isDefault={vocabularyLists[listId]?.isDefault}
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
          totalCount={items.length}
          onToggleAll={handleToggleAll}
        />

        <VocabularyItemsGrid
          items={items}
          isSelectionMode={isSelectionMode}
          viewMode={viewMode}
          selectedIds={selectedIds}
          onToggleItem={toggleItem}
          onCopy={handleCopy}
          onMove={handleMove}
          onDelete={handleItemsDelete}
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
          }}
        />
      )}
    </motion.div>
  );
});

LocalVocabularyDetail.displayName = "LocalVocabularyDetail";

export default LocalVocabularyDetail;
