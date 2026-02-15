"use client";

import { useCallback, useEffect } from "react";
import useSWR from "swr";
import { useAuthUser } from "@/hooks/user/useAuthUser";
import { useLocalActionStore } from "@/store/useLocalActionStore";
import { useUserActionStore } from "@/store/useUserActionStore";
import { useVocabularyStore } from "@/store/useVocabularyStore";
import { ActionType } from "@/services/repositories/UserActionRepository";
import { getUserActions, getSavedExpressionIds } from "@/services/queries/user";
import {
  toggleUserAction,
  toggleSaveExpression,
} from "@/services/actions/user";

export function useUserActions() {
  const { isPro, isLoading: isAuthLoading } = useAuthUser();

  // Save: vocabulary_items 기반 RPC로 조회 (Phase 3)
  // revalidateOnFocus: true — 탭 복귀 시 서버 데이터와 자동 동기화
  const { data: saveActions, mutate: mutateSave } = useSWR(
    isPro ? ["saved_expressions"] : null,
    () => getSavedExpressionIds(),
    {
      dedupingInterval: 5000,
      revalidateOnFocus: true,
    },
  );

  // Learn: 기존 user_actions 유지
  const { data: learnActions, mutate: mutateLearn } = useSWR(
    isPro ? ["actions", "learn"] : null,
    () => getUserActions("learn"),
    {
      dedupingInterval: 5000,
      revalidateOnFocus: true,
    },
  );

  // SWR 데이터 변경 시 스토어에 동기화
  // syncWithServer 내부에서 _pendingOps > 0이면 자동 스킵
  useEffect(() => {
    if (saveActions) {
      useUserActionStore.getState().syncWithServer("save", saveActions);
    }
  }, [saveActions]);

  useEffect(() => {
    if (learnActions) {
      useUserActionStore.getState().syncWithServer("learn", learnActions);
    }
  }, [learnActions]);

  // _initialized: syncWithServer가 호출되어 스토어에 데이터가 반영된 시점에 true.
  // SWR data 도착 → useEffect → syncWithServer 순서이므로,
  // SWR data가 있더라도 _initialized가 false이면 스토어는 아직 빈 상태.
  const isSaveInitialized = useUserActionStore(
    (state) => state._initialized.save,
  );
  const isLearnInitialized = useUserActionStore(
    (state) => state._initialized.learn,
  );

  // Zustand 스토어에서 반응적으로 구독 (변경 시 리렌더 트리거)
  const savedIds = useUserActionStore((state) => state.savedIds);
  const learnedIds = useUserActionStore((state) => state.learnedIds);

  // Local Store (Free 유저용)
  const localActionsState = useLocalActionStore((state) => state.actions);
  const localToggle = useLocalActionStore((state) => state.toggleAction);
  const localVocabularyLists = useLocalActionStore(
    (state) => state.vocabularyLists,
  );
  const localAddToList = useLocalActionStore((state) => state.addToList);
  const localRemoveFromList = useLocalActionStore(
    (state) => state.removeFromList,
  );
  const localGetListIdsForExpression = useLocalActionStore(
    (state) => state.getListIdsForExpression,
  );
  const localGetLists = useLocalActionStore((state) => state.getLists);

  // O(1) Set 조회 (Pro: Zustand 스토어, Free: 로컬 스토어)
  const hasAction = useCallback(
    (expressionId: string, type: ActionType): boolean => {
      if (isPro) {
        const set = type === "save" ? savedIds : learnedIds;
        return set.has(expressionId);
      }
      if (type === "save") {
        // Phase 3: Free 유저도 vocabulary-list 기반으로 저장 여부 파생
        return localGetListIdsForExpression(expressionId).length > 0;
      }
      return localActionsState[type].has(expressionId);
    },
    [
      isPro,
      savedIds,
      learnedIds,
      localActionsState,
      localVocabularyLists,
      localGetListIdsForExpression,
    ],
  );

  const toggleAction = useCallback(
    async (expressionId: string, type: ActionType) => {
      if (isPro) {
        // 낙관적 업데이트 (_pendingOps 자동 증가)
        useUserActionStore.getState().optimisticToggle(expressionId, type);

        if (type === "save") {
          // Phase 3: 단일 RPC → 저장 토글 + 단어장 리스트 반환
          // 1. Vocabulary Store에도 낙관적 업데이트 (item_count 즉시 반영)
          const vocStore = useVocabularyStore.getState();
          // optimisticToggle이 이미 savedIds를 뒤집었으므로,
          // has(expressionId) = true이면 "이제 저장됨" (= willSave)
          const willSave = useUserActionStore
            .getState()
            .savedIds.has(expressionId);

          if (willSave) {
            // 저장: 기본 단어장의 item_count +1
            const defaultList = vocStore.lists.find((l) => l.is_default);
            if (defaultList) {
              vocStore.optimisticToggle(defaultList.id, expressionId, true);
            }
          } else {
            // 해제: 포함된 모든 단어장의 item_count -1
            const containingListIds = vocStore.savedListIds.get(expressionId);
            if (containingListIds) {
              containingListIds.forEach((listId) => {
                vocStore.optimisticToggle(listId, expressionId, false);
              });
            }
          }

          try {
            const freshLists = await toggleSaveExpression(expressionId);

            // RPC 응답으로 vocabulary store 확정 (_pendingOps-- → 0이면 서버 데이터 적용)
            useVocabularyStore.getState().resolveOperation(freshLists);

            // save 스토어 resolve (_pendingOps--)
            useUserActionStore.getState().resolveOperation("save");

            // mutateSave 제거: RPC가 이미 최신 데이터를 반환했고,
            // SWR 리페치는 stale 데이터로 스토어를 덮어쓸 수 있음.
            // 최종 정합성은 revalidateOnFocus가 보장.
          } catch (error) {
            // 실패 시 서버 데이터로 롤백
            const rollbackSaveData = await mutateSave();
            useUserActionStore
              .getState()
              .resolveOperation("save", rollbackSaveData || undefined);
            // vocabulary store도 서버 데이터로 복구
            useVocabularyStore.getState().resolveOperation();
            throw error;
          }
        } else {
          // learn: 기존 로직 유지
          try {
            await toggleUserAction(expressionId, type);
            // 성공: 낙관적 상태가 이미 정확하므로 SWR 리페치 불필요.
            // _pendingOps만 감소. 최종 정합성은 revalidateOnFocus가 보장.
            useUserActionStore.getState().resolveOperation(type);
          } catch (error) {
            // 실패 시 서버 데이터로 롤백
            const rollbackData = await mutateLearn();
            useUserActionStore
              .getState()
              .resolveOperation(type, rollbackData || undefined);
            throw error;
          }
        }
        return;
      }

      // Free 유저
      if (type === "save") {
        // Phase 3: Free 유저의 save도 vocabulary-list 기반
        const isCurrentlySaved =
          localGetListIdsForExpression(expressionId).length > 0;

        if (isCurrentlySaved) {
          // 해제: 포함된 모든 로컬 단어장에서 제거
          const containingListIds = localGetListIdsForExpression(expressionId);
          containingListIds.forEach((listId) => {
            localRemoveFromList(listId, expressionId);
          });
        } else {
          // 저장: 기본 단어장에 추가
          const lists = localGetLists();
          const defaultList = lists.find((l) => l.isDefault) || lists[0];
          if (defaultList) {
            localAddToList(defaultList.id, expressionId);
          }
        }
      } else {
        // learn: 기존 로직 유지
        localToggle(expressionId, type);
      }
    },
    [
      isPro,
      mutateSave,
      mutateLearn,
      localToggle,
      localAddToList,
      localRemoveFromList,
      localGetListIdsForExpression,
      localGetLists,
    ],
  );

  return {
    hasAction,
    toggleAction,
    // 1차 가드: SWR data === undefined → 아직 페칭 전
    // 2차 가드: !_initialized → SWR 데이터가 도착했지만 useEffect→syncWithServer가 아직 미실행
    // 두 가드 중 하나라도 true이면 로딩 상태 유지 → 스토어에 데이터가 확실히 반영된 후에만 해제
    isLoading: {
      save:
        isAuthLoading ||
        (isPro ? saveActions === undefined || !isSaveInitialized : false),
      learn:
        isAuthLoading ||
        (isPro ? learnActions === undefined || !isLearnInitialized : false),
    },
  };
}
