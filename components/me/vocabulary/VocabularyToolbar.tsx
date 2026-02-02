"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { ListChecks, X, LayoutGrid, List } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { useScroll } from "@/hooks/useScroll";
import { VIEW_MODE, ViewMode } from "@/constants/ui";
import { cn, formatMessage } from "@/lib/utils";
import ViewModeButton from "./ViewModeButton";

interface VocabularyToolbarProps {
  isSelectionMode: boolean;
  onToggleSelectionMode: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedCount: number;
}

const VocabularyToolbar = memo(function VocabularyToolbar({
  isSelectionMode,
  onToggleSelectionMode,
  viewMode,
  onViewModeChange,
  selectedCount,
}: VocabularyToolbarProps) {
  const { dict } = useI18n();
  const isStuck = useScroll(80);

  return (
    <div
      className={cn(
        "sticky top-(--header-height) z-30 transition-all duration-300",
        isStuck
          ? "bg-layout-transparent backdrop-blur-xl pt-2 pb-6"
          : "bg-transparent py-0",
      )}
    >
      <div className="max-w-layout mx-auto px-4 sm:px-6 lg:px-8">
        <div className="sticky-toolbar flex items-center justify-between p-2 rounded-xl transition-all duration-300">
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onToggleSelectionMode}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-zinc-400 outline-hidden",
                isSelectionMode
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800",
              )}
            >
              {isSelectionMode ? (
                <>
                  <X size={16} /> {dict.vocabulary.cancel}
                </>
              ) : (
                <>
                  <ListChecks size={16} /> {dict.vocabulary.select}
                </>
              )}
            </motion.button>

            {isSelectionMode && (
              <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-700 mx-2" />
            )}

            {isSelectionMode && (
              <div className="flex bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-xs">
                <ViewModeButton
                  mode={VIEW_MODE.FULL}
                  currentMode={viewMode}
                  onClick={() => onViewModeChange(VIEW_MODE.FULL)}
                  icon={LayoutGrid}
                  label={dict.vocabulary.modeCard}
                />
                <ViewModeButton
                  mode={VIEW_MODE.COMPACT}
                  currentMode={viewMode}
                  onClick={() => onViewModeChange(VIEW_MODE.COMPACT)}
                  icon={List}
                  label={dict.vocabulary.modeCompact}
                />
              </div>
            )}
          </div>

          {isSelectionMode && (
            <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mr-2 tabular-nums">
              {formatMessage(dict.vocabulary.selectedCount, {
                count: selectedCount.toString(),
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

VocabularyToolbar.displayName = "VocabularyToolbar";

export default VocabularyToolbar;
