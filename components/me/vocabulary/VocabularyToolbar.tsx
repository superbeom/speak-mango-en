"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import {
  ListChecks,
  X,
  LayoutGrid,
  List,
  CheckSquare,
  Square,
  Plus,
} from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { useConfirm } from "@/context/ConfirmContext";
import { useScroll } from "@/hooks/useScroll";
import { VIEW_MODE, DIALOG_VARIANT, ViewMode } from "@/constants/ui";
import { cn, formatMessage } from "@/lib/utils";
import ViewModeButton from "./ViewModeButton";

interface VocabularyToolbarProps {
  isSelectionMode: boolean;
  onToggleSelectionMode: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedCount: number;
  totalCount: number;
  onToggleAll: () => void;
}

/**
 * 선택된 항목 수를 표시하는 공통 컴포넌트
 */
const SelectionCount = memo(({ count }: { count: number }) => {
  const { dict } = useI18n();
  return (
    <div className="text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400 tabular-nums pr-1 shrink-0">
      {formatMessage(dict.vocabulary.selectedCount, {
        count: count.toLocaleString(),
      })}
    </div>
  );
});
SelectionCount.displayName = "SelectionCount";

/**
 * 전체 선택/해제 토글 버튼 공통 컴포넌트
 */
const ToggleAllButton = memo(
  ({
    isAllSelected,
    onClick,
    size = 16,
    className,
  }: {
    isAllSelected: boolean;
    onClick: () => void;
    size?: number;
    className?: string;
  }) => {
    const { dict } = useI18n();
    return (
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={cn(
          "font-medium rounded-lg text-zinc-600 dark:text-zinc-400 transition-colors flex items-center gap-2 shrink-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-zinc-400 outline-hidden",
          "sm:hover:bg-zinc-100 dark:sm:hover:bg-zinc-800",
          className,
        )}
      >
        {isAllSelected ? (
          <>
            <Square size={size} />
            <span>{dict.vocabulary.deselectAll}</span>
          </>
        ) : (
          <>
            <CheckSquare size={size} />
            <span>{dict.vocabulary.selectAll}</span>
          </>
        )}
      </motion.button>
    );
  },
);
ToggleAllButton.displayName = "ToggleAllButton";

const VocabularyToolbar = memo(function VocabularyToolbar({
  isSelectionMode,
  onToggleSelectionMode,
  viewMode,
  onViewModeChange,
  selectedCount,
  totalCount,
  onToggleAll,
}: VocabularyToolbarProps) {
  const { dict } = useI18n();
  const { alert } = useConfirm();
  const isStuck = useScroll(80);
  const isAllSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div
      className={cn(
        "sticky top-(--header-height) z-30 transition-all duration-300",
        isStuck
          ? "bg-layout-transparent backdrop-blur-xl pt-2 pb-6"
          : "bg-transparent py-0",
      )}
    >
      <div className="layout-container">
        <div
          className={cn(
            "sticky-toolbar flex flex-col sm:flex-row sm:items-center justify-between p-1.5 sm:p-2 rounded-xl transition-all duration-300",
            isSelectionMode && "gap-2 sm:gap-0",
          )}
        >
          {/* 주요 컨트롤 그룹 */}
          <div className="flex flex-col sm:flex-row sm:items-center flex-1">
            {/* 1단 (모바일) / 왼쪽 그룹 (데스크탑) */}
            <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-1 sm:gap-2">
                {/* 1. 선택 취소/시작 버튼 */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={onToggleSelectionMode}
                  className={cn(
                    "px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shrink-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-zinc-400 outline-hidden",
                    isSelectionMode
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-600 dark:text-zinc-400 sm:hover:bg-zinc-100 dark:sm:hover:bg-zinc-800",
                  )}
                >
                  {isSelectionMode ? (
                    <>
                      <X size={16} />
                      <span>{dict.vocabulary.cancel}</span>
                    </>
                  ) : (
                    <>
                      <ListChecks size={16} />
                      <span>{dict.vocabulary.select}</span>
                    </>
                  )}
                </motion.button>

                {/* 2. 추가 버튼 (비선택 모드에서만 표시) */}
                {!isSelectionMode && (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      alert({
                        title: dict.vocabulary.customWordTitle,
                        description: dict.vocabulary.customWordDesc,
                        variant: DIALOG_VARIANT.INFO,
                      })
                    }
                    className="px-3 sm:px-4 py-2 text-sm font-medium rounded-lg text-zinc-600 dark:text-zinc-400 sm:hover:bg-zinc-100 dark:sm:hover:bg-zinc-800 transition-colors flex items-center gap-2 shrink-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-zinc-400 outline-hidden"
                  >
                    <Plus size={16} />
                    <span>{dict.vocabulary.addCustom}</span>
                  </motion.button>
                )}

                {/* 2. 뷰 모드 전환 (선택 모드 시에만 표시) */}
                {isSelectionMode ? (
                  <div className="flex bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-xs shrink-0">
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
                ) : null}
              </div>

              {/* 데스크탑: 전체 선택 버튼 (취소 옆에 배치) */}
              {isSelectionMode ? (
                <div className="hidden sm:flex items-center ml-2">
                  <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-700 mx-1 shrink-0" />
                  <ToggleAllButton
                    isAllSelected={isAllSelected}
                    onClick={onToggleAll}
                    className="px-3 sm:px-4 py-2 text-sm"
                  />
                </div>
              ) : null}
            </div>

            {/* 2단 (모바일 전용): 전체 선택 & 선택 정보 */}
            {isSelectionMode ? (
              <div className="flex items-center justify-between pt-2 sm:hidden border-t border-zinc-100 dark:border-zinc-800/50 mt-1">
                <ToggleAllButton
                  isAllSelected={isAllSelected}
                  onClick={onToggleAll}
                  size={14}
                  className="px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700"
                />
                <SelectionCount count={selectedCount} />
              </div>
            ) : null}
          </div>

          {/* 데스크탑 전용 선택 정보 (우측 고정) */}
          {isSelectionMode ? (
            <div className="hidden sm:block ml-4">
              <SelectionCount count={selectedCount} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
});

VocabularyToolbar.displayName = "VocabularyToolbar";

export default VocabularyToolbar;
