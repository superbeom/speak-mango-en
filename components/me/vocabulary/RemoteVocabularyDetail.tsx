"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/context/I18nContext";
import { useConfirm } from "@/context/ConfirmContext";
import { useToast } from "@/context/ToastContext";
import { Expression } from "@/types/expression";
import { useAppErrorHandler } from "@/hooks/useAppErrorHandler";
import { useVocabularyView } from "@/hooks/user/useVocabularyView";
import { useBulkAction, BULK_ACTION_TYPE } from "@/hooks/user/useBulkAction";
import {
  updateVocabularyListTitle,
  deleteVocabularyList,
  setDefaultVocabularyList,
  copyExpressionsToVocabularyList,
  moveExpressionsToVocabularyList,
  removeExpressionsFromVocabularyList,
} from "@/services/actions/vocabulary";
import { ROUTES } from "@/lib/routes";
import BulkActionModalWrapper from "@/components/vocabulary/BulkActionModalWrapper";
import VocabularyDetailHeader from "./VocabularyDetailHeader";
import VocabularyItemsGrid from "./VocabularyItemsGrid";
import VocabularyToolbar from "./VocabularyToolbar";

interface RemoteVocabularyDetailProps {
  listId: string;
  title: string;
  items: Expression[];
  isDefault: boolean;
}

export default function RemoteVocabularyDetail({
  listId,
  title: initialTitle,
  items,
  isDefault: initialIsDefault,
}: RemoteVocabularyDetailProps) {
  const router = useRouter();
  const { dict } = useI18n();
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const [title, setTitle] = useState(initialTitle);
  const [isDefault, setIsDefault] = useState(initialIsDefault);
  const { handleError } = useAppErrorHandler();
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

  const handleToggleAll = () => {
    if (selectedIds.size === items.length) {
      clearSelection();
    } else {
      selectAll(items.map((item) => item.id));
    }
  };

  const handleTitleSave = async (newTitle: string) => {
    const previousTitle = title;
    setTitle(newTitle);

    try {
      await updateVocabularyListTitle(listId, newTitle);
      showToast(dict.vocabulary.saveSuccess);
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
        } catch (error) {
          handleError(error);
        }
      },
    });
  };

  return (
    <div className="py-8">
      <div className="max-w-layout mx-auto px-4 sm:px-6 lg:px-8">
        <VocabularyDetailHeader
          title={title}
          itemCount={items.length}
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
            } catch (error) {
              handleError(error); // 1. 사용자에게 에러 토스트를 보여줍니다.
              throw error; // 2. BulkVocabularyListModal에게 실패를 알려 로딩 상태(isSubmitting)를 해제하게 합니다.
            }
          }}
        />
      )}
    </div>
  );
}
