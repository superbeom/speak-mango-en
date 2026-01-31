"use client";

import { useEffect, useState, useMemo, memo } from "react";
import { motion, useAnimation } from "framer-motion";
import { Folder, Plus, MoreVertical, Star } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { useLocalActionStore } from "@/store/useLocalActionStore";
import { useEnableHover } from "@/hooks/useIsMobile";
import { VocabularyList as VocabularyListType } from "@/services/actions/vocabulary";
import { ROUTES } from "@/lib/routes";
import { cn, formatMessage } from "@/lib/utils";
import InteractiveLink from "@/components/ui/InteractiveLink";

interface VocabularyListManagerProps {
  lists: VocabularyListType[];
  isPro: boolean;
}

const VocabularyListCard = memo(function VocabularyListCard({
  list,
  isPro,
  enableHover,
}: {
  list: VocabularyListType;
  isPro: boolean;
  enableHover: boolean;
}) {
  const controls = useAnimation();
  const { dict } = useI18n();

  return (
    <motion.div
      animate={controls}
      whileHover={enableHover ? { y: -4 } : undefined}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <InteractiveLink
        href={ROUTES.VOCABULARY_LIST(list.id)}
        isStatic={false}
        enableHover={enableHover}
        controls={controls as any}
        onClick={() => {}}
      >
        <div
          className={cn(
            "group flex flex-col justify-between h-full p-5 bg-white/50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl backdrop-blur-sm transition-all duration-300 shadow-sm",
            enableHover &&
              "hover:bg-white/80 dark:hover:bg-zinc-800/50 hover:shadow-md dark:hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] dark:hover:border-zinc-700",
          )}
        >
          <div className="flex items-start justify-between mb-4">
            <Folder
              className={`size-6 ${
                list.is_default
                  ? "fill-yellow-400 text-yellow-500"
                  : "text-blue-500 fill-blue-500/10"
              }`}
            />
            <div className="flex items-center gap-2">
              {list.is_default && (
                <Star size={16} className="fill-yellow-400 text-yellow-400" />
              )}
              {isPro && (
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                  <MoreVertical size={16} className="text-zinc-400" />
                </div>
              )}
            </div>
          </div>

          <div>
            <span className="block font-bold text-zinc-900 dark:text-zinc-100 text-base mb-1 truncate">
              {list.title}
            </span>
            <span className="text-xs font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">
              {formatMessage(dict.vocabulary.itemsCount, {
                count: (list.item_count ?? 0).toString(),
              })}
            </span>
          </div>
        </div>
      </InteractiveLink>
    </motion.div>
  );
});

VocabularyListCard.displayName = "VocabularyListCard";

const VocabularyListManager = memo(function VocabularyListManager({
  lists,
  isPro,
}: VocabularyListManagerProps) {
  const { dict } = useI18n();
  const { vocabularyLists } = useLocalActionStore();
  const [isMounted, setIsMounted] = useState(false);
  const enableHover = useEnableHover();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Map local store lists to the expected VocabularyListType format
  const localLists: VocabularyListType[] = useMemo(() => {
    return Object.values(vocabularyLists).map((list) => ({
      id: list.id,
      title: list.title,
      item_count: list.itemIds.size,
      is_default: list.isDefault || false,
      created_at: list.created_at,
    }));
  }, [vocabularyLists]);

  const displayLists = isPro ? lists : isMounted ? localLists : [];

  // If not mounted yet (for hydration safety), render null or skeleton
  if (!isPro && !isMounted) {
    return null;
  }

  // If no lists (empty state)
  if (displayLists.length === 0) {
    if (!isPro) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm">
          <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-3 shadow-inner">
            <Star className="w-6 h-6 text-zinc-400" />
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            {dict.me.noSavedWords}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs leading-relaxed">
            {dict.me.saveExpressionsToSee}
          </p>
        </div>
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
          {dict.me.myLists}
        </h3>
        {isPro && (
          <button className="p-2 -mr-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors bg-white/50 dark:bg-zinc-800/50 hover:bg-white dark:hover:bg-zinc-800 rounded-full active:scale-90">
            <Plus size={20} />
          </button>
        )}
      </div>

      {displayLists.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 text-sm border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/30 dark:bg-zinc-900/30">
          {dict.me.emptyState}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {displayLists.map((list) => (
            <VocabularyListCard
              key={list.id}
              list={list}
              isPro={isPro}
              enableHover={enableHover}
            />
          ))}
        </div>
      )}
    </div>
  );
});

VocabularyListManager.displayName = "VocabularyListManager";

export default VocabularyListManager;
