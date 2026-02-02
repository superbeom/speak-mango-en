"use client";

import { Expression } from "@/types/expression";
import { useVocabularyView } from "@/hooks/user/useVocabularyView";
import VocabularyDetailHeader from "./VocabularyDetailHeader";
import VocabularyItemsGrid from "./VocabularyItemsGrid";
import VocabularyToolbar from "./VocabularyToolbar";

interface RemoteVocabularyDetailProps {
  title: string;
  items: Expression[];
}

export default function RemoteVocabularyDetail({
  title,
  items,
}: RemoteVocabularyDetailProps) {
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

  return (
    <div className="py-8">
      <div className="max-w-layout mx-auto px-4 sm:px-6 lg:px-8">
        <VocabularyDetailHeader title={title} itemCount={items.length} />
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
