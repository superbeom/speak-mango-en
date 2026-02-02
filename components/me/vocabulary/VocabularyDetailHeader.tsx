"use client";

import { memo } from "react";
import { useI18n } from "@/context/I18nContext";
import { cn } from "@/lib/utils";
import BackButton from "@/components/BackButton";

interface VocabularyDetailHeaderProps {
  title: string;
  itemCount: number;
  className?: string;
}

const VocabularyDetailHeader = memo(function VocabularyDetailHeader({
  title,
  itemCount,
  className,
}: VocabularyDetailHeaderProps) {
  const { dict } = useI18n();

  return (
    <div className={cn("mb-8", className)}>
      <BackButton label={dict.common.back} className="mb-4" />
      <div className="flex items-end gap-3 min-w-0">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 truncate">
          {title}
        </h1>
        <span className="mb-1.5 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-500 dark:text-zinc-400">
          {itemCount}
        </span>
      </div>
    </div>
  );
});

VocabularyDetailHeader.displayName = "VocabularyDetailHeader";

export default VocabularyDetailHeader;
