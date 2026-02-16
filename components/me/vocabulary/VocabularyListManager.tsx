"use client";

import { useEffect, useState, useMemo, memo } from "react";
import { motion, useAnimation } from "framer-motion";
import { Folder, Plus, Star, BookOpenCheck, MoreVertical } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { VocabularyListWithCount } from "@/types/vocabulary";
import { useLocalActionStore } from "@/store/useLocalActionStore";
import { useVocabularyStore, selectLists } from "@/store/useVocabularyStore";
import { useVocabularyModalStore } from "@/store/useVocabularyModalStore";
import { useEnableHover } from "@/hooks/useIsMobile";
import { ROUTES } from "@/lib/routes";
import { cn, formatMessage, formatVocabularyLists } from "@/lib/utils";
import InteractiveLink from "@/components/ui/InteractiveLink";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import VocabularyEmptyState from "./VocabularyEmptyState";

interface VocabularyListManagerProps {
  lists: VocabularyListWithCount[];
  isPro: boolean;
  remoteLearnedCount?: number;
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
            !isLearned &&
            "glass-panel-hover dark:hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]",
          // Learned 폴더 스타일
          isLearned &&
            "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200/50 dark:border-blue-800/30",
          // Learned 폴더 호버
          isLearned &&
            enableHover &&
            "hover:bg-blue-100/40 dark:hover:bg-blue-900/15 hover:border-blue-300/40 dark:hover:border-blue-700/40 hover:shadow-md dark:hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all duration-300",
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
          <span
            className={cn(
              "text-xs font-medium px-2 py-1 rounded-md",
              isLearned
                ? "bg-white/60 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" // Learned
                : "text-zinc-500 bg-zinc-100 dark:bg-zinc-800", // Default
            )}
          >
            {formatMessage(dict.vocabulary.itemsCount, {
              count: (list.item_count ?? 0).toLocaleString(),
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
  remoteLearnedCount = 0,
}: VocabularyListManagerProps) {
  const { dict } = useI18n();
  const { vocabularyLists, actions } = useLocalActionStore();
  const [isMounted, setIsMounted] = useState(false);
  const enableHover = useEnableHover();
  const { openModal } = useVocabularyModalStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Learned List Item (Static)
  const learnedCount = isPro ? remoteLearnedCount : actions.learn.size;

  const learnedList: VocabularyListWithCount = useMemo(
    () => ({
      id: LEARNED_FOLDER_ID,
      title: dict.me.learned,
      item_count: learnedCount,
      is_default: false,
    }),
    [dict.me.learned, learnedCount],
  );

  // Map local store lists (Free 유저)
  const localLists: VocabularyListWithCount[] = useMemo(() => {
    return formatVocabularyLists(vocabularyLists);
  }, [vocabularyLists]);

  // Pro 유저: Zustand 스토어에 낙관적 데이터가 있으면 우선 사용, 없으면 서버 prop 사용
  const zustandLists = useVocabularyStore(selectLists);
  const activeLists = isPro
    ? zustandLists.length > 0
      ? zustandLists
      : lists
    : localLists;

  // 서버 prop을 초기 데이터로 스토어에 동기화 (스토어가 비어있을 때만)
  useEffect(() => {
    if (
      isPro &&
      lists.length > 0 &&
      useVocabularyStore.getState().lists.length === 0
    ) {
      useVocabularyStore.getState().syncWithServer(lists);
    }
  }, [isPro, lists]);

  // Learned 폴더를 제외한 커스텀 리스트 (디폴트가 맨 앞에 오도록 정렬)
  const customLists = useMemo(
    () =>
      activeLists
        .filter(
          (l) =>
            l.id !== LEARNED_FOLDER_ID && l.title?.toLowerCase() !== "learned",
        )
        .sort((a, b) => {
          if (a.is_default && !b.is_default) return -1;
          if (!a.is_default && b.is_default) return 1;
          return 0;
        }),
    [activeLists],
  );

  // If not mounted yet (for hydration safety), render null
  if (!isPro && !isMounted) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
          {dict.me.myLists}
        </h3>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 -mr-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors rounded-full cursor-pointer outline-hidden">
                <MoreVertical size={20} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => openModal()}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 outline-hidden dark:text-zinc-300 transition-colors"
              >
                <Plus size={16} />
                {dict.vocabulary.add}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Static Learned Folder - Always show as first item */}
        <motion.div layout id={LEARNED_FOLDER_ID} className="relative h-full">
          <VocabularyListCard list={learnedList} enableHover={enableHover} />
        </motion.div>

        {/* Custom Lists */}
        {customLists.map((list) => (
          <motion.div
            key={list.id}
            layout
            className="h-full"
            style={{ position: "relative" }}
          >
            <VocabularyListCard list={list} enableHover={enableHover} />
          </motion.div>
        ))}
      </div>

      {customLists.length === 0 && (
        <div className="mt-2">
          <VocabularyEmptyState
            message={dict.me.noLists}
            description={dict.me.emptyState}
          />
        </div>
      )}
    </div>
  );
});

VocabularyListManager.displayName = "VocabularyListManager";

export default VocabularyListManager;
