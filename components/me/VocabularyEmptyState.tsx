"use client";

import { memo } from "react";
import { Star } from "lucide-react";
import { useI18n } from "@/context/I18nContext";

const VocabularyEmptyState = memo(function VocabularyEmptyState({
  message,
  description,
}: {
  message?: string;
  description?: string;
}) {
  const { dict } = useI18n();

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm">
      <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-3 shadow-inner">
        <Star className="w-6 h-6 text-zinc-400" />
      </div>
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
        {message || dict.me.noSavedExpressions}
      </h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs leading-relaxed">
        {description || dict.me.saveExpressionsToSee}
      </p>
    </div>
  );
});

VocabularyEmptyState.displayName = "VocabularyEmptyState";

export default VocabularyEmptyState;
