"use client";

import { useCallback } from "react";
import { useAppErrorHandler } from "@/hooks/useAppErrorHandler";
import { useAuthUser } from "@/hooks/user/useAuthUser";
import { useUserActions } from "@/hooks/user/useUserActions";

/**
 * useSaveToggle
 *
 * 이 훅은 "저장(Save)" 액션의 상태를 관리하고 토글하는 로직을 캡슐화합니다.
 * - 저장 상태 확인: 사용자가 해당 표현식을 저장했는지 여부를 확인합니다.
 * - 저장 토글: 저장 상태를 토글하는 비동기 함수를 제공합니다.
 * - 로딩 상태: 액션의 초기 로딩 상태를 추적합니다.
 */
export function useSaveToggle(expressionId: string) {
  const { handleError } = useAppErrorHandler();
  const { user } = useAuthUser();
  const { toggleAction, hasAction, isLoading } = useUserActions();

  const isSaved = hasAction(expressionId, "save");

  const toggleSaveState = useCallback(async () => {
    if (!user) return { shouldOpenLoginModal: true };

    try {
      await toggleAction(expressionId, "save");
      return { shouldOpenLoginModal: false };
    } catch (error) {
      handleError(error);
      throw error;
    }
  }, [user, expressionId, toggleAction, handleError]);

  return {
    isSaved,
    toggleSaveState,
    isInitialLoading: isLoading.save,
  };
}
