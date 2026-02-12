"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { useVocabularyModalStore } from "@/store/useVocabularyModalStore";
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
  const [isSyncing, setIsSyncing] = useState(false); // Loading feedback for sync operations
  const { openModal, setOnListAction } = useVocabularyModalStore();

  const { isSaved, toggleSaveState, isInitialLoading } =
    useSaveToggle(expressionId);
  const { getActiveLists, syncOnSave, syncOnUnsave, getContainingListIds } =
    useVocabularySync(expressionId);

  const syncingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const isSavedRef = useRef(isSaved);
  isSavedRef.current = isSaved;

  const handleListActionSync = useCallback(
    async (_listId: string, added: boolean) => {
      if (!isMountedRef.current) return;
      const currentSaved = isSavedRef.current;

      if (added) {
        if (!currentSaved) {
          try {
            await toggleAction(expressionId, "save");
          } catch (e) {
            if (isMountedRef.current) console.error("Sync save failed", e);
          }
        }
      } else {
        const containing = await getContainingListIds(expressionId);
        if (containing.length === 0 && currentSaved) {
          try {
            await toggleAction(expressionId, "save");
          } catch (e) {
            if (isMountedRef.current) console.error("Sync unsave failed", e);
          }
        }
      }
    },
    [expressionId, toggleAction, getContainingListIds],
  );

  const openListModal = useCallback(() => {
    setOnListAction(handleListActionSync);
    openModal(expressionId);
  }, [expressionId, handleListActionSync, openModal, setOnListAction]);

  const handleSaveToggle = useCallback(async () => {
    if (!user) return { shouldOpenLoginModal: true };
    if (syncingRef.current) return { shouldOpenLoginModal: false }; // Critical #1: Race condition fix

    syncingRef.current = true;
    setIsSyncing(true);

    const willSave = !isSaved;

    if (willSave) {
      try {
        const availableLists = await getActiveLists();

        if (availableLists.length === 0) {
          openListModal();
          if (isMountedRef.current) {
            syncingRef.current = false;
            setIsSyncing(false);
          }
          return { shouldOpenLoginModal: false };
        }

        await Promise.all([toggleSaveState(), syncOnSave(availableLists)]);
      } catch (error) {
        if (isMountedRef.current) console.error("Save sync failed:", error);
      } finally {
        if (isMountedRef.current) {
          syncingRef.current = false;
          setIsSyncing(false);
        }
      }
    } else {
      try {
        await Promise.all([toggleSaveState(), syncOnUnsave()]);
      } catch (error) {
        if (isMountedRef.current) console.error("Unsave sync failed:", error);
      } finally {
        if (isMountedRef.current) {
          syncingRef.current = false;
          setIsSyncing(false);
        }
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
    openListModal,
  ]);

  return {
    isSaved,
    isInitialLoading: isInitialLoading || isSyncing,
    openListModal,
    handleSaveToggle,
  };
}
