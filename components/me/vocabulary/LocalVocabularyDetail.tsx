"use client";

import { useEffect, useState, memo } from "react";
import { notFound } from "next/navigation";
import { motion } from "framer-motion";
import { Expression } from "@/types/expression";
import { useLocalActionStore } from "@/store/useLocalActionStore";
import { useVocabularyView } from "@/hooks/user/useVocabularyView";
import { getExpressionsByIds } from "@/services/actions/expressions";
import VocabularyDetailHeader from "./VocabularyDetailHeader";
import VocabularyItemsGrid from "./VocabularyItemsGrid";
import VocabularyToolbar from "./VocabularyToolbar";

interface LocalVocabularyDetailProps {
  listId: string;
}

const LocalVocabularyDetail = memo(function LocalVocabularyDetail({
  listId,
}: LocalVocabularyDetailProps) {
  const { vocabularyLists } = useLocalActionStore();
  const {
    isSelectionMode,
    viewMode,
    selectedIds,
    toggleSelectionMode,
    toggleItem,
    setViewMode,
  } = useVocabularyView();

  const [listTitle, setListTitle] = useState("");
  const [items, setItems] = useState<Expression[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

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
  }, [listId, vocabularyLists]);

  if (error) {
    notFound();
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-layout mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-10 w-48 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-40 bg-zinc-100 dark:bg-zinc-800 rounded-2xl animate-pulse"
            />
          ))}
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
        <VocabularyDetailHeader title={listTitle} itemCount={items.length} />
      </div>

      <div className="mt-8 space-y-10">
        <VocabularyToolbar
          isSelectionMode={isSelectionMode}
          onToggleSelectionMode={toggleSelectionMode}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedCount={selectedIds.size}
        />

        <VocabularyItemsGrid
          items={items}
          isSelectionMode={isSelectionMode}
          viewMode={viewMode}
          selectedIds={selectedIds}
          onToggleItem={toggleItem}
        />
      </div>
    </motion.div>
  );
});

LocalVocabularyDetail.displayName = "LocalVocabularyDetail";

export default LocalVocabularyDetail;
