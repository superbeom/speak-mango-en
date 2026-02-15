"use client";

import { useCallback, useRef, useEffect } from "react";
import { useVocabularyModalStore } from "@/store/useVocabularyModalStore";
import { useVocabularyStore } from "@/store/useVocabularyStore";
import { useUserActionStore } from "@/store/useUserActionStore";
import { useAuthUser } from "@/hooks/user/useAuthUser";
import { useSaveToggle } from "./useSaveToggle";
import { useVocabularySync } from "./useVocabularySync";

/**
 * useSaveAction
 *
 * Phase 3: 저장 토글이 단일 RPC(toggleSaveExpression)로 처리됩니다.
 * - 저장: RPC가 기본 단어장 추가 + 최신 리스트 반환을 원자적으로 처리
 * - 해제: RPC가 모든 단어장 제거 + 최신 리스트 반환을 원자적으로 처리
 * - 단어장 모달에서의 개별 리스트 추가/제거는 기존 toggleInList 로직 유지
 */
export function useSaveAction(expressionId: string) {
  const { user, isPro } = useAuthUser();
  const { openModal, setOnListAction } = useVocabularyModalStore();

  const { isSaved, toggleSaveState, isInitialLoading } =
    useSaveToggle(expressionId);
  const { getActiveLists, getContainingListIds } = useVocabularySync();

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

      // Phase 3: Free 유저의 save 상태는 vocabularyLists에서 파생되므로,
      // toggleInList이 이미 단어장을 수정한 시점에서 save 상태도 자동으로 변경됨.
      // toggleAction("save")를 호출하면 이미 변경된 상태를 다시 토글하여 역방향 동작 발생.
      if (!isPro) return;

      // Pro 유저: savedIds(userActionStore)와 vocabularyStore는 별개이므로 명시적 동기화 필요.
      // 단, toggleAction("save")는 사용 불가:
      //   - toggleSaveExpression RPC를 호출하여 기본 단어장에도 추가하는 부작용 발생.
      //   - toggleInList이 이미 서버 쪽 리스트 추가/제거를 처리하므로 RPC는 불필요.
      // → savedIds만 직접 업데이트하여 북마크 아이콘 상태를 동기화.
      const currentSaved = isSavedRef.current;
      const store = useUserActionStore.getState();

      if (added && !currentSaved) {
        // 리스트에 추가됨 → savedIds에 반영 (북마크 ON)
        store.optimisticToggle(expressionId, "save");
        store.resolveOperation("save");
      } else if (!added) {
        // 마이크로태스크 양보: 이 콜백은 toggleInList보다 먼저 발화(fire-and-forget)되므로,
        // optimisticToggle이 먼저 실행되어 클라이언트 스토어가 업데이트되도록 한 틱 기다린다.
        await Promise.resolve();

        // Zustand 스토어에서 낙관적 데이터를 읽는다.
        // 서버 쿼리(getSavedListIds)는 아직 제거가 반영되지 않은 stale 데이터를 반환하므로 사용하면 안 된다.
        const savedIds = useVocabularyStore
          .getState()
          .savedListIds.get(expressionId);

        // Zustand 스토어에 데이터가 있으면 (모달에서 syncSavedListIds로 초기화됨) 직접 사용.
        // 없으면 getContainingListIds 폴백 (서버 조회).
        const remainingCount =
          savedIds !== undefined
            ? savedIds.size
            : (await getContainingListIds(expressionId)).length;

        if (remainingCount === 0 && currentSaved) {
          // 모든 리스트에서 제거됨 → savedIds에서 제거 (북마크 OFF)
          store.optimisticToggle(expressionId, "save");
          store.resolveOperation("save");
        }
      }
    },
    [expressionId, isPro, getContainingListIds],
  );

  // Stale Closure 방지: handleListActionSync는 isPro 등의 변화에 따라 재생성되지만,
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

        // Phase 3: toggleSaveState → toggleAction("save") → 단일 RPC
        // RPC가 기본 단어장 추가 + 리스트 반환을 원자적으로 처리
        await toggleSaveState();
      } catch (error) {
        if (isMountedRef.current) console.error("Save failed:", error);
      }
    } else {
      try {
        // Phase 3: toggleSaveState → toggleAction("save") → 단일 RPC
        // RPC가 모든 단어장 제거 + 리스트 반환을 원자적으로 처리
        await toggleSaveState();
      } catch (error) {
        if (isMountedRef.current) console.error("Unsave failed:", error);
      }
    }

    return { shouldOpenLoginModal: false };
  }, [user, isSaved, getActiveLists, toggleSaveState, openListModal]);

  return {
    isSaved,
    isInitialLoading,
    openListModal,
    handleSaveToggle,
  };
}
