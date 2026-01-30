"use client";
import { memo, useRef } from "react";
import { Check, Star } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { VocabularyList } from "@/services/actions/vocabulary";
import { formatMessage } from "@/lib/utils";

interface VocabularyListItemProps {
  list: VocabularyList;
  isSelected: boolean;
  onToggle: () => void;
  isDefault?: boolean;
  onSetDefault: () => void;
}

const VocabularyListItem = memo(function VocabularyListItem({
  list,
  isSelected,
  onToggle,
  isDefault,
  onSetDefault,
}: VocabularyListItemProps) {
  const { dict } = useI18n();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const handlePressStart = () => {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      if (!isDefault) {
        onSetDefault();
      }
    }, 600); // 600ms long press
  };

  const handlePressEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isLongPress.current) {
      e.preventDefault();
      return;
    }
    onToggle();
  };

  return (
    <button
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onClick={handleClick}
      onContextMenu={(e) => e.preventDefault()}
      className="flex w-full items-center justify-between rounded-lg p-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900 sm:cursor-pointer touch-manipulation transition-colors active:bg-zinc-100 dark:active:bg-zinc-800"
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {list.title}
          </span>
          {isDefault && (
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          )}
        </div>
        <span className="text-xs text-zinc-500">
          {formatMessage(dict.vocabulary.itemsCount, {
            count: (list.item_count ?? 0).toString(),
          })}
        </span>
      </div>
      {isSelected && (
        <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
      )}
    </button>
  );
});

export default VocabularyListItem;
