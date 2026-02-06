"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { useAuthUser } from "@/hooks/user/useAuthUser";
import { useLocalActionStore } from "@/store/useLocalActionStore";
import { ActionType } from "@/services/repositories/UserActionRepository";
import { getUserActions, toggleUserAction } from "@/services/actions/user";

export function useUserActions() {
  const { isPro } = useAuthUser();

  const {
    data: saveActions,
    isLoading: isSaveLoading,
    mutate: mutateSave,
  } = useSWR(isPro ? ["actions", "save"] : null, () => getUserActions("save"), {
    dedupingInterval: 5000,
    revalidateOnFocus: false,
  });

  const {
    data: learnActions,
    isLoading: isLearnLoading,
    mutate: mutateLearn,
  } = useSWR(
    isPro ? ["actions", "learn"] : null,
    () => getUserActions("learn"),
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
    },
  );

  const localGetActions = useLocalActionStore((state) => state.getActions);
  const localToggle = useLocalActionStore((state) => state.toggleAction);

  const hasAction = useCallback(
    (expressionId: string, type: ActionType): boolean => {
      if (isPro) {
        const list = type === "save" ? saveActions : learnActions;
        return list?.includes(expressionId) ?? false;
      }
      return localGetActions(type).includes(expressionId);
    },
    [isPro, saveActions, learnActions, localGetActions],
  );

  const toggleAction = useCallback(
    async (expressionId: string, type: ActionType) => {
      if (isPro) {
        const isSave = type === "save";
        const currentData = (isSave ? saveActions : learnActions) || [];
        const mutateFn = isSave ? mutateSave : mutateLearn;

        // Calculate new state
        const newData = currentData.includes(expressionId)
          ? currentData.filter((id) => id !== expressionId)
          : [...currentData, expressionId];

        // 1. Optimistic Update: Update cache immediately
        await mutateFn(newData, { revalidate: false });

        try {
          // 2. Perform actual server action
          await toggleUserAction(expressionId, type);
          // No need to revalidate if successful, as our optimistic state is correct
        } catch (error) {
          // 3. Rollback on error
          await mutateFn(currentData, { revalidate: false });
          throw error;
        }
        return;
      }
      localToggle(expressionId, type);
    },
    [isPro, saveActions, learnActions, mutateSave, mutateLearn, localToggle],
  );

  return {
    hasAction,
    toggleAction,
    isLoading: {
      save: isPro ? isSaveLoading : false,
      learn: isPro ? isLearnLoading : false,
    },
  };
}
