"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { useAuthUser } from "@/hooks/user/useAuthUser";
import { useLocalActionStore } from "@/store/useLocalActionStore";
import { createAppError, VOCABULARY_ERROR } from "@/types/error";
import { VocabularyListWithCount } from "@/types/vocabulary";
import {
  getVocabularyLists,
  getSavedListIds,
} from "@/services/queries/vocabulary";
import {
  createVocabularyList,
  addToVocabularyList,
  removeFromVocabularyList,
  setDefaultVocabularyList,
} from "@/services/actions/vocabulary";

export function useVocabularyLists() {
  const { isPro } = useAuthUser();

  // SWR for Pro Users
  // Key must be null if not pro to disable fetching
  const {
    data: remoteLists,
    isLoading: isRemoteLoading,
    mutate,
  } = useSWR<VocabularyListWithCount[]>(
    isPro ? "vocabulary_lists" : null,
    () => getVocabularyLists(),
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
      fallbackData: [],
    },
  );

  // Local Store Selectors
  const vocabularyListsMap = useLocalActionStore(
    (state) => state.vocabularyLists,
  );
  const localCreateList = useLocalActionStore((state) => state.createList);
  const localAddToList = useLocalActionStore((state) => state.addToList);
  const localRemoveFromList = useLocalActionStore(
    (state) => state.removeFromList,
  );
  const localGetListIds = useLocalActionStore(
    (state) => state.getListIdsForExpression,
  );
  const localSetDefaultList = useLocalActionStore(
    (state) => state.setDefaultList,
  );

  // Computed Lists (Memoized)
  const lists = useMemo(() => {
    if (isPro) {
      return remoteLists || [];
    }

    const sortedLists = Object.values(vocabularyListsMap).sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return a.createdAt.localeCompare(b.createdAt);
    });

    return sortedLists.map((l) => ({
      id: l.id,
      title: l.title,
      item_count: l.itemIds.size,
      is_default: l.isDefault || false,
    }));
  }, [isPro, remoteLists, vocabularyListsMap]);

  const createList = useCallback(
    async (title: string): Promise<string | undefined> => {
      if (!isPro) {
        if (lists.length >= 5) {
          throw createAppError(VOCABULARY_ERROR.LIMIT_REACHED);
        }
        return localCreateList(title);
      }
      const newList = await createVocabularyList(title);
      await mutate(); // Refresh SWR cache and wait for update
      return newList?.id;
    },
    [isPro, lists.length, localCreateList, mutate],
  );

  const toggleInList = useCallback(
    async (listId: string, expressionId: string, isCurrentlyIn: boolean) => {
      if (!isPro) {
        if (isCurrentlyIn) {
          localRemoveFromList(listId, expressionId);
        } else {
          localAddToList(listId, expressionId);
        }
        return;
      }

      if (isCurrentlyIn) {
        await removeFromVocabularyList(listId, expressionId);
      } else {
        await addToVocabularyList(listId, expressionId);
      }
      mutate(); // Refresh SWR cache to update counts
    },
    [isPro, localRemoveFromList, localAddToList, mutate],
  );

  // Helper to get which lists contain the expression
  const getContainingListIds = useCallback(
    async (expressionId: string): Promise<string[]> => {
      if (!isPro) {
        return localGetListIds(expressionId);
      }
      return getSavedListIds(expressionId);
    },
    [isPro, localGetListIds],
  );

  const setDefaultList = useCallback(
    async (listId: string) => {
      if (!isPro) {
        localSetDefaultList(listId);
        return;
      }
      try {
        await setDefaultVocabularyList(listId);
        mutate();
      } catch (error) {
        console.error("Failed to set default list", error);
      }
    },
    [isPro, localSetDefaultList, mutate],
  );

  const refreshLists = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return {
    lists,
    isLoading: isPro ? isRemoteLoading : false,
    createList,
    toggleInList,
    getContainingListIds,
    setDefaultList,
    refreshLists,
    isPro,
  };
}
