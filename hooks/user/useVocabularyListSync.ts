import { useCallback } from "react";
import { useSWRConfig } from "swr";
import { VocabularyListWithCount } from "@/types/vocabulary";
import { useVocabularyStore } from "@/store/useVocabularyStore";

/**
 * 단어장 리스트의 Zustand 스토어 ↔ SWR 캐시 동기화를 중앙 관리하는 훅.
 *
 * 제공하는 3가지 유틸리티:
 * - resolveAndSyncLists: 낙관적 작업 확정 + 스토어 → SWR 캐시 반영
 * - adjustItemCounts: item_count 일괄 조정 + SWR 캐시 동기화
 * - invalidateOtherDetailPages: 다른 상세 페이지 SWR 캐시 무효화
 */
export function useVocabularyListSync(listId: string) {
  const { mutate: globalMutate } = useSWRConfig();

  // 낙관적 작업 확정 + 스토어 데이터를 SWR 캐시에 반영
  const resolveAndSyncLists = useCallback(
    (serverData?: VocabularyListWithCount[]) => {
      useVocabularyStore.getState().resolveOperation(serverData);
      globalMutate(
        "vocabulary_lists",
        useVocabularyStore.getState().lists,
        false,
      );
    },
    [globalMutate],
  );

  // item_count 일괄 조정 + SWR 캐시 동기화
  // revalidate: true → 서버 중복 무시(ON CONFLICT DO NOTHING)로 인한
  // 부정확한 낙관적 카운트를 백그라운드 리페치로 자동 교정
  const adjustItemCounts = useCallback(
    (adjustments: Record<string, number>) => {
      const updatedLists = useVocabularyStore.getState().lists.map((l) => {
        const delta = adjustments[l.id];
        return delta !== undefined
          ? { ...l, item_count: Math.max(0, (l.item_count || 0) + delta) }
          : l;
      });
      useVocabularyStore.getState().setLists(updatedLists);
      globalMutate("vocabulary_lists", updatedLists, { revalidate: true });
    },
    [globalMutate],
  );

  // 다른 단어장 상세 페이지의 SWR 캐시 무효화 (setDefault 시 is_default 변경 전파)
  const invalidateOtherDetailPages = useCallback(() => {
    globalMutate(
      (key) =>
        Array.isArray(key) &&
        key[0] === "vocabulary-details" &&
        key[1] !== listId,
      undefined,
      { revalidate: true },
    );
  }, [globalMutate, listId]);

  return {
    resolveAndSyncLists,
    adjustItemCounts,
    invalidateOtherDetailPages,
  };
}
