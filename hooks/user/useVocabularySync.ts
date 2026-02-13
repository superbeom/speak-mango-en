"use client";

import { useCallback } from "react";
import { VocabularyListWithCount } from "@/types/vocabulary";
import { useAuthUser } from "@/hooks/user/useAuthUser";
import { useVocabularyLists } from "@/hooks/user/useVocabularyLists";
import { useLocalActionStore } from "@/store/useLocalActionStore";
import { getVocabularyLists } from "@/services/queries/vocabulary";

export function useVocabularySync(expressionId: string) {
  const { isPro } = useAuthUser();
  const { lists, getContainingListIds, toggleInList, refreshLists } =
    useVocabularyLists();

  const localAddToList = useLocalActionStore((state) => state.addToList);
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

  const syncOnSave = useCallback(
    async (availableLists: VocabularyListWithCount[]) => {
      if (availableLists.length === 0) return;

      const firstList = availableLists[0];
      if (isPro) {
        // toggleInList을 통해 Zustand 스토어 낙관적 업데이트까지 수행
        await toggleInList(firstList.id, expressionId, false);
      } else {
        localAddToList(firstList.id, expressionId);
      }
    },
    [isPro, expressionId, localAddToList, toggleInList],
  );

  const syncOnUnsave = useCallback(async () => {
    const containingIds = await getContainingListIds(expressionId);
    await Promise.all(
      containingIds.map((listId) => toggleInList(listId, expressionId, true)),
    );
  }, [expressionId, getContainingListIds, toggleInList]);

  return { getActiveLists, syncOnSave, syncOnUnsave, getContainingListIds };
}
