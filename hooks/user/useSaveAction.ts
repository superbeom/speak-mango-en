"use client";

import { useCallback, useState } from "react";
import { useAuthUser } from "@/hooks/user/useAuthUser";
import { useUserActions } from "@/hooks/user/useUserActions";
import { useSaveToggle } from "./useSaveToggle";
import { useVocabularySync } from "./useVocabularySync";

/**
 * useSaveAction
 *
 * 이 훅은 "저장(Save)" 액션과 "단어장(Vocabulary List)" 간의 동기화 로직을 캡슐화합니다.
 * - 저장 토글 시: 자동으로 기본 단어장에 추가하거나, 모든 단어장으로부터 제거합니다.
 * - 상세 관리: 단어장 모달을 열거나 닫는 상태를 관리합니다.
 */
export function useSaveAction(expressionId: string) {
  const { user } = useAuthUser();
  const { toggleAction } = useUserActions();
  const [isListModalOpen, setIsListModalOpen] = useState(false);

  const { isSaved, toggleSaveState, setIsSaved } = useSaveToggle(expressionId);
  const { getActiveLists, syncOnSave, syncOnUnsave, getContainingListIds } =
    useVocabularySync(expressionId);

  /**
   * Main logic for Save button click
   */
  const handleSaveToggle = useCallback(async () => {
    // 1. Check Auth
    if (!user) return { shouldOpenLoginModal: true };

    const willSave = !isSaved;

    if (willSave) {
      // 2. [SAVE ON] - Find available lists
      const availableLists = await getActiveLists();

      // If no lists exist, open modal to create first list
      if (availableLists.length === 0) {
        setIsListModalOpen(true);
        return { shouldOpenLoginModal: false };
      }

      // 3. Toggle Action and Sync with default list
      try {
        await toggleSaveState();
        await syncOnSave(availableLists);
      } catch (error) {
        // Rollback already handled in toggleSaveState
        console.error("Save sync failed:", error);
      }
    } else {
      // [SAVE OFF]
      try {
        await toggleSaveState();
        await syncOnUnsave();
      } catch (error) {
        console.error("Unsave sync failed:", error);
      }
    }

    return { shouldOpenLoginModal: false };
  }, [
    user,
    isSaved,
    getActiveLists,
    toggleSaveState,
    syncOnSave,
    syncOnUnsave,
  ]);

  /**
   * Sync save state based on list modal actions
   */
  const handleListActionSync = useCallback(
    async (_listId: string, added: boolean) => {
      if (added) {
        if (!isSaved) {
          setIsSaved(true);
          try {
            await toggleAction(expressionId, "save");
          } catch (e) {
            console.error("Sync save failed", e);
            setIsSaved(false);
          }
        }
      } else {
        const containing = await getContainingListIds(expressionId);
        if (containing.length === 0 && isSaved) {
          setIsSaved(false);
          try {
            await toggleAction(expressionId, "save");
          } catch (e) {
            console.error("Sync unsave failed", e);
            setIsSaved(true);
          }
        }
      }
    },
    [isSaved, expressionId, toggleAction, getContainingListIds, setIsSaved],
  );

  return {
    isSaved,
    isListModalOpen,
    setIsListModalOpen,
    handleSaveToggle,
    handleListActionSync,
  };
}
