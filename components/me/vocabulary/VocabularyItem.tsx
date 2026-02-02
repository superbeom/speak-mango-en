"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Expression } from "@/types/expression";
import { VIEW_MODE, ViewMode } from "@/constants/ui";
import { cn } from "@/lib/utils";
import ExpressionCard from "@/components/ExpressionCard";
import { Checkbox } from "@/components/ui/checkbox";

interface VocabularyItemProps {
  item: Expression;
  isSelected: boolean;
  onToggle: () => void;
  viewMode: ViewMode;
  isSelectionMode: boolean;
}

const VocabularyItem = memo(function VocabularyItem({
  item,
  isSelected,
  onToggle,
  viewMode,
  isSelectionMode,
}: VocabularyItemProps) {
  const isCompact = isSelectionMode && viewMode === VIEW_MODE.COMPACT;

  return (
    <motion.div
      className={cn("relative block h-full", !isSelected && "group")}
      onClick={onToggle}
    >
      {isCompact ? (
        <div
          className={cn(
            "cursor-pointer relative flex flex-col justify-between p-4 rounded-xl border transition-all duration-200 h-full",
            isSelected
              ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <span className="font-bold text-lg text-zinc-900 dark:text-zinc-100 line-clamp-2">
              {item.expression}
            </span>
            <div className="mt-1 shrink-0">
              <Checkbox checked={isSelected} readOnly />
            </div>
          </div>
        </div>
      ) : (
        <div className="relative h-full">
          <ExpressionCard item={item} isStatic={isSelectionMode} />

          {/* Overlay for selection in Full Mode */}
          {isSelectionMode && (
            <div
              className={cn(
                "absolute inset-0 z-10 cursor-pointer rounded-card transition-all duration-200 border-2",
                isSelected
                  ? "bg-blue-500/10 border-blue-500"
                  : "bg-transparent border-transparent hover:bg-black/5 dark:hover:bg-white/5 hover:border-zinc-300 dark:hover:border-zinc-700",
              )}
            >
              <div className="absolute top-4 right-4">
                <div
                  className={cn(
                    "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors shadow-sm",
                    isSelected
                      ? "bg-blue-500 border-blue-500"
                      : "bg-white/80 dark:bg-black/80 border-zinc-300 dark:border-zinc-600",
                  )}
                >
                  {isSelected && (
                    <div className="h-2.5 w-2.5 bg-white rounded-full" />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
});

VocabularyItem.displayName = "VocabularyItem";

export default VocabularyItem;
