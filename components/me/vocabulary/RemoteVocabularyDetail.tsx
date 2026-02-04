"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/context/I18nContext";
import { useToast } from "@/context/ToastContext";
import { Expression } from "@/types/expression";
import { useAppErrorHandler } from "@/hooks/useAppErrorHandler";
import { useVocabularyView } from "@/hooks/user/useVocabularyView";
import {
  updateVocabularyListTitle,
  deleteVocabularyList,
  setDefaultVocabularyList,
} from "@/services/actions/vocabulary";
import { ROUTES } from "@/lib/routes";
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
        />
      </div>
    </div>
  );
}
