"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuthUser } from "@/hooks/user/useAuthUser";
import { useLocalActionStore } from "@/store/useLocalActionStore";
import { createAppError, VOCABULARY_ERROR } from "@/types/error";
import {
  getVocabularyLists,
  createVocabularyList,
  addToVocabularyList,
  removeFromVocabularyList,
  getSavedListIds,
  VocabularyList,
} from "@/services/actions/vocabulary";

export function useVocabularyLists() {
  const { isPro } = useAuthUser();
  const [lists, setLists] = useState<VocabularyList[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Local Store Selectors
  // Fix: Select raw state to avoid "getSnapshot" infinite loop from new array references
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

  const fetchLists = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isPro) {
        const remoteLists = await getVocabularyLists();
        setLists(remoteLists);
      } else {
        // Derive list from stable map
        const sortedLists = Object.values(vocabularyListsMap).sort((a, b) =>
          a.created_at.localeCompare(b.created_at),
        );

        // Map LocalVocabularyList to compatible type
        const mapped = sortedLists.map((l) => ({
          id: l.id,
          title: l.title,
          item_count: l.itemIds.size,
        }));
        setLists(mapped);
      }
    } catch (error) {
      console.error("Failed to fetch lists", error);
    } finally {
      setIsLoading(false);
    }
  }, [isPro, vocabularyListsMap]);

  const createList = useCallback(
    async (title: string) => {
      if (!isPro) {
        if (lists.length >= 5) {
          throw createAppError(VOCABULARY_ERROR.LIMIT_REACHED);
        }
        localCreateList(title);
        return;
      }
      await createVocabularyList(title);
      fetchLists(); // Refresh
    },
    [isPro, lists.length, localCreateList, fetchLists],
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
      // No need to refetch all lists, but we might want to update UI state
    },
    [isPro, localRemoveFromList, localAddToList],
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

  // Initial fetch
  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  return {
    lists,
    isLoading,
    createList,
    toggleInList,
    getContainingListIds,
    refreshLists: fetchLists,
    isPro,
  };
}
