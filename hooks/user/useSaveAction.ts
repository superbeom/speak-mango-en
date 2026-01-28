import { useCallback, useState, useEffect } from "react";
import { useLocalActionStore } from "@/store/useLocalActionStore";
import { useAuthUser } from "@/hooks/user/useAuthUser";
import { useUserActions } from "@/hooks/user/useUserActions";
import { useVocabularyLists } from "@/hooks/user/useVocabularyLists";
import { addToVocabularyList } from "@/services/actions/vocabulary";

/**
 * useSaveAction
 *
 * 이 훅은 "저장(Save)" 액션과 "단어장(Vocabulary List)" 간의 동기화 로직을 캡슐화합니다.
 * - 저장 토글 시: 자동으로 기본 단어장에 추가하거나, 모든 단어장에서 제거합니다.
 * - 리스트 변경 시: 단어장이 하나라도 있으면 저장 상태를 유지하고, 없으면 저장 상태를 해제합니다.
 */
export function useSaveAction(expressionId: string) {
  const { user, isPro } = useAuthUser();
  const { toggleAction, hasAction } = useUserActions();
  const {
    getContainingListIds,
    toggleInList,
    lists, // 현재 로드된 리스트 목록 (캐시된 상태일 수 있음)
    refreshLists,
  } = useVocabularyLists();

  const [isSaved, setIsSaved] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);

  // 로컬 단어장 직접 접근 (Free 유저용)
  const getLocalLists = useLocalActionStore((state) => state.getLists);
  const localAddToList = useLocalActionStore((state) => state.addToList);

  // 초기 저장 상태 확인
  useEffect(() => {
    const checkStatus = async () => {
      if (!user) {
        setIsSaved(false);
        return;
      }
      const status = await hasAction(expressionId, "save");
      setIsSaved(status);
    };
    checkStatus();
  }, [expressionId, hasAction, user]);

  /**
   * Save 버튼을 클릭했을 때의 메인 로직
   */
  const handleSaveToggle = useCallback(async () => {
    if (!user) {
      // 로그인 모달을 띄우는 역할은 컴포넌트에게 위임하거나 여기서 처리
      return { shouldOpenLoginModal: true };
    }

    const willSave = !isSaved;

    if (willSave) {
      // [저장 ON]
      let availableLists = lists;

      // 리스트가 캐시되지 않았거나 비어있을 경우 즉시 조회 시도 (Stale Closure 방지)
      if (availableLists.length === 0) {
        if (isPro) {
          // 서버에서 최신 리스트 가져오기
          try {
            // 서비스 함수 직접 호출
            // (Next.js Server Actions는 클라이언트에서 호출 가능)
            const freshLists =
              await import("@/services/actions/vocabulary").then((mod) =>
                mod.getVocabularyLists(),
              );
            availableLists = freshLists;
            // 훅의 상태도 업데이트 (선택 사항, UI 동기화를 위해)
            refreshLists();
          } catch (e) {
            console.error("Failed to fetch fresh lists", e);
          }
        } else {
          // 로컬 스토어에서 최신 리스트 가져오기
          availableLists = anyToVocabularyList(getLocalLists());
        }
      }

      // 그래도 리스트가 없으면 -> 단어장 생성 모달 열기
      if (availableLists.length === 0) {
        setIsListModalOpen(true);
        return { shouldOpenLoginModal: false };
      }

      // 낙관적 업데이트
      setIsSaved(true);

      try {
        await toggleAction(expressionId, "save");

        // 기본 단어장(첫 번째)에 추가
        const firstList = availableLists[0];
        if (isPro) {
          await addToVocabularyList(firstList.id, expressionId);
        } else {
          localAddToList(firstList.id, expressionId);
        }
      } catch (error) {
        console.error("Failed to save:", error);
        setIsSaved(false); // 롤백
      }
    } else {
      // [저장 OFF] (저장 취소)
      setIsSaved(false);

      try {
        await toggleAction(expressionId, "save");

        // 모든 단어장에서 제거
        // 저장된 리스트 ID를 가져와서 제거
        const containingIds = await getContainingListIds(expressionId);

        if (isPro) {
          await Promise.all(
            containingIds.map((listId) =>
              toggleInList(listId, expressionId, true),
            ),
          );
        } else {
          // Free 유저는 동기적으로 처리됨 (store)
          containingIds.forEach((listId) => {
            toggleInList(listId, expressionId, true);
          });
        }
      } catch (error) {
        console.error("Failed to unsave:", error);
        setIsSaved(true); // 롤백
      }
    }

    return { shouldOpenLoginModal: false };
  }, [
    user,
    isSaved,
    isPro,
    lists,
    expressionId,
    toggleAction,
    localAddToList,
    getLocalLists,
    getContainingListIds,
    toggleInList,
    refreshLists,
  ]);

  /**
   * 단어장 모달에서 체크박스 변경 시 동기화
   */
  const handleListActionSync = useCallback(
    async (_listId: string, added: boolean) => {
      // 1. 단어장에 추가됨 -> 무조건 저장 상태 ON
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
        // 2. 단어장에서 제거됨 -> 다른 단어장에 남아있는지 확인
        const containing = await getContainingListIds(expressionId);
        const isStillInAnyList = containing.length > 0;

        if (!isStillInAnyList && isSaved) {
          setIsSaved(false); // 더 이상 담긴 곳이 없으므로 저장 해제
          try {
            await toggleAction(expressionId, "save");
          } catch (e) {
            console.error("Sync unsave failed", e);
            setIsSaved(true);
          }
        }
      }
    },
    [isSaved, expressionId, toggleAction, getContainingListIds],
  );

  return {
    isSaved,
    isListModalOpen,
    setIsListModalOpen,
    handleSaveToggle,
    handleListActionSync,
  };
}

// 헬퍼: 로컬 스토어 타입 변환
function anyToVocabularyList(localLists: any[]): any[] {
  return localLists.map((l: any) => ({
    id: l.id,
    title: l.title,
    item_count: l.itemIds.size,
  }));
}
