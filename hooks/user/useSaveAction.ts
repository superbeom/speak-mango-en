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
  const [isSyncing, setIsSyncing] = useState(false); // Loading feedback for sync operations

  const { isSaved, toggleSaveState, isInitialLoading } =
    useSaveToggle(expressionId);
  const { getActiveLists, syncOnSave, syncOnUnsave, getContainingListIds } =
    useVocabularySync(expressionId);

  const handleSaveToggle = useCallback(async () => {
    if (!user) return { shouldOpenLoginModal: true };
    if (isSyncing) return { shouldOpenLoginModal: false }; // Prevent race conditions

    const willSave = !isSaved;

    if (willSave) {
      setIsSyncing(true);
      try {
        const availableLists = await getActiveLists();

        if (availableLists.length === 0) {
          setIsListModalOpen(true);
          setIsSyncing(false);
          return { shouldOpenLoginModal: false };
        }

        await Promise.all([toggleSaveState(), syncOnSave(availableLists)]);
      } catch (error) {
        console.error("Save sync failed:", error);
      } finally {
        setIsSyncing(false);
      }
    } else {
      setIsSyncing(true);
      try {
        await Promise.all([toggleSaveState(), syncOnUnsave()]);
      } catch (error) {
        console.error("Unsave sync failed:", error);
      } finally {
        setIsSyncing(false);
      }
    }

    return { shouldOpenLoginModal: false };
  }, [
    user,
    isSaved,
    isSyncing,
    getActiveLists,
    toggleSaveState,
    syncOnSave,
    syncOnUnsave,
  ]);

  const handleListActionSync = useCallback(
    async (_listId: string, added: boolean) => {
      if (added) {
        if (!isSaved) {
          try {
            await toggleAction(expressionId, "save");
          } catch (e) {
            console.error("Sync save failed", e);
          }
        }
      } else {
        const containing = await getContainingListIds(expressionId);
        if (containing.length === 0 && isSaved) {
          try {
            await toggleAction(expressionId, "save");
          } catch (e) {
            console.error("Sync unsave failed", e);
          }
        }
      }
    },
    [isSaved, expressionId, toggleAction, getContainingListIds],
  );

  return {
    isSaved,
    isInitialLoading: isInitialLoading || isSyncing,
    isListModalOpen,
    setIsListModalOpen,
    handleSaveToggle,
    handleListActionSync,
  };
}
