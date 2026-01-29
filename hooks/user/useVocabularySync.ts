"use client";

import { useCallback } from "react";
import { useAuthUser } from "@/hooks/user/useAuthUser";
import { useVocabularyLists } from "@/hooks/user/useVocabularyLists";
import { useLocalActionStore } from "@/store/useLocalActionStore";
import {
  addToVocabularyList,
  getVocabularyLists,
  VocabularyList,
} from "@/services/actions/vocabulary";

export function useVocabularySync(expressionId: string) {
  const { isPro } = useAuthUser();
  const { lists, getContainingListIds, toggleInList, refreshLists } =
    useVocabularyLists();

  const localAddToList = useLocalActionStore((state) => state.addToList);
  const getLocalLists = useLocalActionStore((state) => state.getLists);

  const getActiveLists = useCallback(async (): Promise<VocabularyList[]> => {
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
      }));
    }
  }, [isPro, lists, refreshLists, getLocalLists]);

  const syncOnSave = useCallback(
    async (availableLists: VocabularyList[]) => {
      if (availableLists.length === 0) return;

      const firstList = availableLists[0];
      if (isPro) {
        await addToVocabularyList(firstList.id, expressionId);
      } else {
        localAddToList(firstList.id, expressionId);
      }
    },
    [isPro, expressionId, localAddToList],
  );

  const syncOnUnsave = useCallback(async () => {
    const containingIds = await getContainingListIds(expressionId);
    await Promise.all(
      containingIds.map((listId) => toggleInList(listId, expressionId, true)),
    );
  }, [expressionId, getContainingListIds, toggleInList]);

  return { getActiveLists, syncOnSave, syncOnUnsave, getContainingListIds };
}
