"use client";

import { useCallback, useRef, useEffect } from "react";
import { useVocabularyModalStore } from "@/store/useVocabularyModalStore";
import { useVocabularyStore } from "@/store/useVocabularyStore";
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
  const { openModal, setOnListAction } = useVocabularyModalStore();

  const { isSaved, toggleSaveState, isInitialLoading } =
    useSaveToggle(expressionId);
  const { getActiveLists, syncOnSave, syncOnUnsave, getContainingListIds } =
    useVocabularySync(expressionId);

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
        // 마이크로태스크 양보: 이 콜백은 toggleInList보다 먼저 발화(fire-and-forget)되므로,
        // optimisticToggle(Pro) 또는 localRemoveFromList(Free)이 먼저 실행되어
        // 클라이언트 스토어가 업데이트되도록 한 틱 기다린다.
        await Promise.resolve();

        // Zustand 스토어에서 낙관적 데이터를 읽는다 (Pro 유저).
        // 서버 쿼리(getSavedListIds)는 아직 제거가 반영되지 않은 stale 데이터를 반환하므로 사용하면 안 된다.
        const savedIds = useVocabularyStore
          .getState()
          .savedListIds.get(expressionId);

        // Zustand 스토어에 데이터가 있으면 (모달에서 syncSavedListIds로 초기화됨) 직접 사용.
        // 없으면 getContainingListIds 폴백 (Free 유저 → 로컬 스토어, 이미 동기 업데이트 완료).
        const remainingCount =
          savedIds !== undefined
            ? savedIds.size
            : (await getContainingListIds(expressionId)).length;

        if (remainingCount === 0 && currentSaved) {
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

  // Stale Closure 방지: handleListActionSync는 toggleAction의 변화에 따라 재생성되지만,
  // setOnListAction으로 모달 스토어에 저장된 콜백은 모달이 열릴 때의 버전으로 고정된다.
  // ref를 통해 항상 최신 handleListActionSync를 가리키도록 한다.
  const listActionSyncRef = useRef(handleListActionSync);
  listActionSyncRef.current = handleListActionSync;

  // 안정적인 래퍼: 모달 스토어에 저장되어도 항상 최신 ref를 통해 호출
  const stableListActionSync = useCallback(
    (listId: string, added: boolean) =>
      listActionSyncRef.current(listId, added),
    [],
  );

  const openListModal = useCallback(() => {
    setOnListAction(stableListActionSync);
    openModal(expressionId);
  }, [expressionId, stableListActionSync, openModal, setOnListAction]);

  const handleSaveToggle = useCallback(async () => {
    if (!user) return { shouldOpenLoginModal: true };

    // _pendingOps가 동시 작업의 일관성을 보장.
    // optimisticToggle → 즉시 UI 반영 → 서버 액션은 백그라운드.
    const willSave = !isSaved;

    if (willSave) {
      try {
        const availableLists = await getActiveLists();

        if (availableLists.length === 0) {
          openListModal();
          return { shouldOpenLoginModal: false };
        }

        // 낙관적 업데이트는 toggleSaveState/syncOnSave 내부에서 즉시 발생
        await Promise.all([toggleSaveState(), syncOnSave(availableLists)]);
      } catch (error) {
        if (isMountedRef.current) console.error("Save sync failed:", error);
      }
    } else {
      try {
        await Promise.all([toggleSaveState(), syncOnUnsave()]);
      } catch (error) {
        if (isMountedRef.current) console.error("Unsave sync failed:", error);
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
    isInitialLoading,
    openListModal,
    handleSaveToggle,
  };
}
