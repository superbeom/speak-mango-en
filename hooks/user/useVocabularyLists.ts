"use client";

import { useCallback, useEffect, useMemo } from "react";
import useSWR from "swr";
import { useAuthUser } from "@/hooks/user/useAuthUser";
import { useLocalActionStore } from "@/store/useLocalActionStore";
import { useVocabularyStore, selectLists } from "@/store/useVocabularyStore";
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

  // SWR은 데이터 소스로만 사용 (백그라운드 동기화)
  const { data: serverData, mutate } = useSWR<VocabularyListWithCount[]>(
    isPro ? "vocabulary_lists" : null,
    () => getVocabularyLists(),
    {
      dedupingInterval: 5000,
      revalidateOnFocus: true,
      fallbackData: [],
    },
  );

  // SWR 데이터 변경 시 스토어에 동기화
  // syncWithServer 내부에서 _pendingOps > 0이면 자동 스킵
  useEffect(() => {
    if (serverData && serverData.length > 0) {
      useVocabularyStore.getState().syncWithServer(serverData);
    }
  }, [serverData]);

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

  // UI는 Pro 유저일 때 Zustand 스토어에서 바로 표시 (즉시 반영)
  const zustandLists = useVocabularyStore(selectLists);

  // Computed Lists (Memoized) — 항상 is_default가 맨 앞에 오도록 정렬
  const lists = useMemo(() => {
    if (isPro) {
      const source = zustandLists.length > 0 ? zustandLists : serverData || [];
      return [...source].sort((a, b) => {
        if (a.is_default && !b.is_default) return -1;
        if (!a.is_default && b.is_default) return 1;
        return 0;
      });
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
  }, [isPro, zustandLists, serverData, vocabularyListsMap]);

  const createList = useCallback(
    async (title: string): Promise<string | undefined> => {
      if (!isPro) {
        if (lists.length >= 5) {
          throw createAppError(VOCABULARY_ERROR.LIMIT_REACHED);
        }
        return localCreateList(title);
      }

      try {
        const newList = await createVocabularyList(title);
        await mutate();
        return newList?.id;
      } catch (error) {
        throw error;
      }
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

      // 낙관적 업데이트 (_pendingOps 자동 증가)
      const add = !isCurrentlyIn;
      useVocabularyStore.getState().optimisticToggle(listId, expressionId, add);

      try {
        if (isCurrentlyIn) {
          await removeFromVocabularyList(listId, expressionId);
        } else {
          await addToVocabularyList(listId, expressionId);
        }
        // 서버 액션 완료 → 최신 데이터로 resolve
        const freshData = await mutate();
        useVocabularyStore.getState().resolveOperation(freshData || undefined);
      } catch (error) {
        // 실패 시 resolved + 서버 데이터로 롤백
        const rollbackData = await mutate();
        useVocabularyStore
          .getState()
          .resolveOperation(rollbackData || serverData || undefined);
        throw error;
      }
    },
    [isPro, localRemoveFromList, localAddToList, mutate, serverData],
  );

  // 특정 표현이 포함된 리스트 ID 조회
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

      // 낙관적 업데이트 (_pendingOps 자동 증가)
      useVocabularyStore.getState().optimisticSetDefault(listId);

      try {
        await setDefaultVocabularyList(listId);
        const freshData = await mutate();
        useVocabularyStore.getState().resolveOperation(freshData || undefined);
      } catch (error) {
        const rollbackData = await mutate();
        useVocabularyStore
          .getState()
          .resolveOperation(rollbackData || serverData || undefined);
        throw error;
      }
    },
    [isPro, localSetDefaultList, mutate, serverData],
  );

  const refreshLists = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return {
    lists,
    isLoading: false,
    createList,
    toggleInList,
    getContainingListIds,
    setDefaultList,
    refreshLists,
    isPro,
  };
}
