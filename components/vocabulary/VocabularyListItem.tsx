"use client";
import { memo } from "react";
import { Check, Star } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { VocabularyListWithCount } from "@/types/vocabulary";
import { useLongPress } from "@/hooks/useLongPress";
import { formatMessage, cn } from "@/lib/utils";

interface VocabularyListItemProps {
  list: VocabularyListWithCount;
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

  const longPressProps = useLongPress(
    () => {
      if (!isDefault) onSetDefault();
    },
    () => onToggle(),
  );

  return (
    <button
      {...longPressProps}
      className={cn(
        "vocab-list-item sm:cursor-pointer",
        isSelected ? "vocab-list-item-selected" : "vocab-list-item-default",
      )}
    >
      <div className="flex flex-col items-start gap-1">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "font-medium text-sm",
              isSelected
                ? "vocab-list-text-selected"
                : "vocab-list-text-default",
            )}
          >
            {list.title}
          </span>
          {isDefault && (
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />
          )}
        </div>
        <span className="text-xs text-zinc-400">
          {formatMessage(dict.vocabulary.itemsCount, {
            count: (list.item_count ?? 0).toString(),
          })}
        </span>
      </div>
      {isSelected && (
        <div className="vocab-list-check">
          <Check size={18} />
        </div>
      )}
    </button>
  );
});

export default VocabularyListItem;
