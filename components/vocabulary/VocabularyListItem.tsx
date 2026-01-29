"use client";

import { memo } from "react";
import { Check } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { VocabularyList } from "@/services/actions/vocabulary";
import { formatMessage } from "@/lib/utils";

interface VocabularyListItemProps {
  list: VocabularyList;
  isSelected: boolean;
  onToggle: () => void;
}

const VocabularyListItem = memo(function VocabularyListItem({
  list,
  isSelected,
  onToggle,
}: VocabularyListItemProps) {
  const { dict } = useI18n();

  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-lg p-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900 sm:cursor-pointer"
    >
      <div className="flex flex-col">
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {list.title}
        </span>
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
