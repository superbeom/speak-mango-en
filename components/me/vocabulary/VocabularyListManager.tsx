"use client";

import { useEffect, useState, useMemo, memo } from "react";
import { motion, useAnimation, Reorder, LayoutGroup } from "framer-motion";
import { Folder, Plus, Star, BookOpenCheck } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { VocabularyListWithCount } from "@/types/vocabulary";
import { useLocalActionStore } from "@/store/useLocalActionStore";
import { useEnableHover } from "@/hooks/useIsMobile";
import { ROUTES } from "@/lib/routes";
import { cn, formatMessage } from "@/lib/utils";
import InteractiveLink from "@/components/ui/InteractiveLink";
import VocabularyEmptyState from "./VocabularyEmptyState";

interface VocabularyListManagerProps {
  lists: VocabularyListWithCount[];
  isPro: boolean;
}

const LEARNED_FOLDER_ID = "learned";

const VocabularyListCard = memo(function VocabularyListCard({
  list,
  enableHover,
}: {
  list: VocabularyListWithCount;
  enableHover: boolean;
}) {
  const controls = useAnimation();
  const { dict } = useI18n();
  const isLearned = list.id === LEARNED_FOLDER_ID;

  // Learned 폴더는 드래그 불가
  // Default 폴더도 드래그는 가능하지만 최상위 유지는 로직에서 처리 필요 (여기서는 UI만)

  return (
    <InteractiveLink
      href={isLearned ? ROUTES.LEARNED : ROUTES.VOCABULARY_LIST(list.id)}
      isStatic={false}
      enableHover={enableHover}
      controls={controls}
      onClick={() => {}}
      className="h-full block"
    >
      <div
        className={cn(
          "group flex flex-col justify-between h-full p-5 rounded-2xl glass-panel",
          enableHover &&
            "glass-panel-hover dark:hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]",
          // Learned 폴더 스타일
          isLearned &&
            "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200/50 dark:border-blue-800/30",
        )}
      >
        <div className="flex items-start justify-between mb-4">
          {isLearned ? (
            <BookOpenCheck className="size-6 text-green-500 fill-green-500/10" />
          ) : (
            <Folder
              className={`size-6 ${
                list.is_default
                  ? "fill-yellow-400 text-yellow-500"
                  : "text-blue-500 fill-blue-500/10"
              }`}
            />
          )}

          {!isLearned && list.is_default && (
            <Star size={16} className="fill-yellow-400 text-yellow-400" />
          )}
        </div>

        <div>
          <span
            className={cn(
              "block font-bold text-base mb-1 truncate",
              isLearned
                ? "text-blue-700 dark:text-blue-300"
                : "text-zinc-900 dark:text-zinc-100",
            )}
          >
            {isLearned ? dict.me.learned : list.title}
          </span>
          <span className="text-xs font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">
            {isLearned
              ? "View All"
              : formatMessage(dict.vocabulary.itemsCount, {
                  count: (list.item_count ?? 0).toString(),
                })}
          </span>
        </div>
      </div>
    </InteractiveLink>
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

  // Learned List Item (Static)
  const learnedList: VocabularyListWithCount = useMemo(
    () => ({
      id: LEARNED_FOLDER_ID,
      title: dict.me.learned,
      item_count: 0, // TODO: Fetch learned count?
      is_default: false,
    }),
    [dict.me.learned],
  );

  // Map local store lists
  const localLists: VocabularyListWithCount[] = useMemo(() => {
    return Object.values(vocabularyLists).map((list) => ({
      id: list.id,
      title: list.title,
      item_count: list.itemIds.size,
      is_default: list.isDefault || false,
    }));
  }, [vocabularyLists]);

  // Combine lists
  const [orderedLists, setOrderedLists] = useState<VocabularyListWithCount[]>(
    [],
  );

  useEffect(() => {
    const customLists = (isPro ? lists : localLists).filter(
      (l) => l.id !== LEARNED_FOLDER_ID && l.title?.toLowerCase() !== "learned",
    );
    setOrderedLists(customLists);
  }, [isPro, isMounted, lists, localLists]);

  const handleReorder = (newOrder: VocabularyListWithCount[]) => {
    setOrderedLists(newOrder);

    // TODO: Persist order to DB or Local
    // const customListsOnly = newOrder.filter(l => l.id !== LEARNED_FOLDER_ID);
  };

  // If not mounted yet (for hydration safety), render null
  if (!isPro && !isMounted) {
    return null;
  }

  return (
    <LayoutGroup>
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
            {dict.me.myLists}
          </h3>
          {isPro && (
            <button className="p-2 -mr-2 text-zinc-400 transition-colors glass-panel rounded-full active:scale-90 overflow-hidden">
              <Plus size={20} />
            </button>
          )}
        </div>

        <Reorder.Group
          axis="y"
          values={orderedLists}
          onReorder={handleReorder}
          className="grid grid-cols-2 gap-3 sm:gap-4 relative"
          layoutScroll
        >
          {/* Static Learned Folder - Always show as first item */}
          <motion.div layout id={LEARNED_FOLDER_ID} className="relative h-full">
            <VocabularyListCard list={learnedList} enableHover={enableHover} />
          </motion.div>

          {/* Custom Lists */}
          {orderedLists.map((list) => (
            <Reorder.Item
              key={list.id}
              value={list}
              dragListener={true}
              className="h-full"
              style={{ position: "relative" }}
            >
              <VocabularyListCard list={list} enableHover={enableHover} />
            </Reorder.Item>
          ))}
        </Reorder.Group>

        {orderedLists.length === 0 && (
          <div className="mt-2">
            <VocabularyEmptyState description={dict.me.emptyState} />
          </div>
        )}
      </div>
    </LayoutGroup>
  );
});

VocabularyListManager.displayName = "VocabularyListManager";

export default VocabularyListManager;
