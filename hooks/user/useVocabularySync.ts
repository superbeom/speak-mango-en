"use client";

import { useCallback } from "react";
import { VocabularyListWithCount } from "@/types/vocabulary";
import { useAuthUser } from "@/hooks/user/useAuthUser";
import { useVocabularyLists } from "@/hooks/user/useVocabularyLists";
import { useLocalActionStore } from "@/store/useLocalActionStore";
import { getVocabularyLists } from "@/services/queries/vocabulary";

export function useVocabularySync() {
  const { isPro } = useAuthUser();
  const { lists, getContainingListIds, refreshLists } = useVocabularyLists();

  const getLocalLists = useLocalActionStore((state) => state.getLists);

  const getActiveLists = useCallback(async (): Promise<
    VocabularyListWithCount[]
  > => {
    if (lists.length > 0) return lists;

    if (isPro) {
      try {
        const fresh = await getVocabularyLists();
        refreshLists();
        return fresh;
      } catch (e) {
        console.error("Failed to fetch fresh lists", e);
        return [];
      }
    } else {
      const local = getLocalLists();
      return local.map((l) => ({
        id: l.id,
        title: l.title,
        item_count: l.itemIds.size,
        is_default: l.isDefault || false,
      }));
    }
  }, [isPro, lists, refreshLists, getLocalLists]);

  return { getActiveLists, getContainingListIds };
}
