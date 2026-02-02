"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Trash2, FolderInput } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { Expression } from "@/types/expression";
import { VIEW_MODE, ViewMode } from "@/constants/ui";
import { cn } from "@/lib/utils";
import VocabularyEmptyState from "./VocabularyEmptyState";
import VocabularyItem from "./VocabularyItem";

interface VocabularyItemsGridProps {
  items: Expression[];
  isSelectionMode: boolean;
  viewMode: ViewMode;
  selectedIds: Set<string>;
  onToggleItem: (id: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const VocabularyItemsGrid = memo(function VocabularyItemsGrid({
  items,
  isSelectionMode,
  viewMode,
  selectedIds,
  onToggleItem,
}: VocabularyItemsGridProps) {
  const { dict } = useI18n();

  if (items.length === 0) {
    return (
      <div className="max-w-layout mx-auto px-4 sm:px-6 lg:px-8">
        <VocabularyEmptyState />
      </div>
    );
  }

  return (
    <div className="max-w-layout mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          "grid gap-4 sm:gap-6",
          viewMode === VIEW_MODE.COMPACT
            ? "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {items.map((item) => (
            <VocabularyItem
              key={item.id}
              item={item}
              isSelected={selectedIds.has(item.id)}
              onToggle={() => onToggleItem(item.id)}
              viewMode={viewMode}
              isSelectionMode={isSelectionMode}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Bulk Actions Floating Bar */}
      <AnimatePresence>
        {isSelectionMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 floating-action-bar"
          >
            <button
              className="flex flex-col items-center gap-1 px-4 py-2 hover:bg-white/10 dark:hover:bg-black/10 rounded-xl transition-colors min-w-[60px]"
              onClick={() => console.log("Copy", selectedIds)}
            >
              <Copy size={20} />
              <span className="text-[10px] font-medium">
                {dict.vocabulary.copy}
              </span>
            </button>
            <div className="w-px h-8 bg-white/20 dark:bg-black/20" />
            <button
              className="flex flex-col items-center gap-1 px-4 py-2 hover:bg-white/10 dark:hover:bg-black/10 rounded-xl transition-colors min-w-[60px]"
              onClick={() => console.log("Move", selectedIds)}
            >
              <FolderInput size={20} />
              <span className="text-[10px] font-medium">
                {dict.vocabulary.move}
              </span>
            </button>
            <div className="w-px h-8 bg-white/20 dark:bg-black/20" />
            <button
              className="flex flex-col items-center gap-1 px-4 py-2 text-red-400 dark:text-red-600 hover:bg-red-500/10 rounded-xl transition-colors min-w-[60px]"
              onClick={() => console.log("Delete", selectedIds)}
            >
              <Trash2 size={20} />
              <span className="text-[10px] font-medium">
                {dict.vocabulary.delete}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

VocabularyItemsGrid.displayName = "VocabularyItemsGrid";

export default VocabularyItemsGrid;
