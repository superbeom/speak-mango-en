"use client";

import { useCallback, useEffect } from "react";
import useSWR from "swr";
import { useAuthUser } from "@/hooks/user/useAuthUser";
import { useLocalActionStore } from "@/store/useLocalActionStore";
import {
  useUserActionStore,
  selectIsInitialized,
} from "@/store/useUserActionStore";
import { ActionType } from "@/services/repositories/UserActionRepository";
import { getUserActions } from "@/services/queries/user";
import { toggleUserAction } from "@/services/actions/user";

export function useUserActions() {
  const { isPro, isLoading: isAuthLoading } = useAuthUser();

  // SWR은 데이터 소스로만 사용 (백그라운드 동기화)
  // revalidateOnFocus: true — 탭 복귀 시 서버 데이터와 자동 동기화
  const { data: saveActions, mutate: mutateSave } = useSWR(
    isPro ? ["actions", "save"] : null,
    () => getUserActions("save"),
    {
      dedupingInterval: 5000,
      revalidateOnFocus: true,
    },
  );

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

  // Zustand 스토어에서 초기화 상태 구독
  const isSaveInitialized = useUserActionStore(selectIsInitialized("save"));
  const isLearnInitialized = useUserActionStore(selectIsInitialized("learn"));

  // Zustand 스토어에서 반응적으로 구독 (변경 시 리렌더 트리거)
  const savedIds = useUserActionStore((state) => state.savedIds);
  const learnedIds = useUserActionStore((state) => state.learnedIds);

  // Local Store (Free 유저용)
  const localActionsState = useLocalActionStore((state) => state.actions);
  const localToggle = useLocalActionStore((state) => state.toggleAction);

  // O(1) Set 조회 (Pro: Zustand 스토어, Free: 로컬 스토어)
  const hasAction = useCallback(
    (expressionId: string, type: ActionType): boolean => {
      if (isPro) {
        const set = type === "save" ? savedIds : learnedIds;
        return set.has(expressionId);
      }
      return localActionsState[type].has(expressionId);
    },
    [isPro, savedIds, learnedIds, localActionsState],
  );

  const toggleAction = useCallback(
    async (expressionId: string, type: ActionType) => {
      if (isPro) {
        const isSave = type === "save";
        const mutateFn = isSave ? mutateSave : mutateLearn;

        // 낙관적 업데이트 (_pendingOps 자동 증가)
        useUserActionStore.getState().optimisticToggle(expressionId, type);

        try {
          await toggleUserAction(expressionId, type);
          // 성공: 낙관적 상태가 이미 정확하므로 SWR 리페치 불필요.
          // _pendingOps만 감소. 최종 정합성은 revalidateOnFocus가 보장.
          useUserActionStore.getState().resolveOperation(type);
        } catch (error) {
          // 실패 시 서버 데이터로 롤백
          const rollbackData = await mutateFn();
          useUserActionStore
            .getState()
            .resolveOperation(type, rollbackData || undefined);
          throw error;
        }
        return;
      }
      localToggle(expressionId, type);
    },
    [isPro, mutateSave, mutateLearn, localToggle],
  );

  return {
    hasAction,
    toggleAction,
    isLoading: {
      save: isAuthLoading || (isPro ? !isSaveInitialized : false),
      learn: isAuthLoading || (isPro ? !isLearnInitialized : false),
    },
  };
}
