import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { enableMapSet } from "immer";
import { VocabularyListWithCount } from "@/types/vocabulary";

// Immer에서 Map/Set을 사용하기 위해 플러그인 활성화
enableMapSet();

// 빈 Set 참조를 재사용하여 불필요한 리렌더링 방지
const EMPTY_SET: Set<string> = new Set();

interface VocabularyStore {
  // 상태
  lists: VocabularyListWithCount[];
  savedListIds: Map<string, Set<string>>; // expressionId -> listIds
  _pendingOps: number; // 진행 중인 낙관적 업데이트 수

  // 서버 동기용
  setLists: (lists: VocabularyListWithCount[]) => void;
  syncWithServer: (serverData: VocabularyListWithCount[]) => void;

  // 낙관적 업데이트 (모두 _pendingOps 증가)
  optimisticToggle: (
    listId: string,
    expressionId: string,
    add: boolean,
  ) => void;
  optimisticSetDefault: (listId: string) => void;
  optimisticUpdateTitle: (listId: string, title: string) => void;
  optimisticDeleteList: (listId: string) => void;

  // 작업 완료 시 호출: _pendingOps 감소, 0이면 서버 데이터로 동기화
  resolveOperation: (serverData?: VocabularyListWithCount[]) => void;

  // 저장 리스트 관리
  syncSavedListIds: (expressionId: string, listIds: string[]) => void;
}

export const useVocabularyStore = create<VocabularyStore>()(
  immer((set, get) => ({
    lists: [],
    savedListIds: new Map(),
    _pendingOps: 0,

    setLists: (lists) => set({ lists }),

    // 백그라운드 SWR 동기화용: _pendingOps가 0일 때만 적용
    syncWithServer: (serverData) => {
      if (get()._pendingOps === 0) {
        set({ lists: serverData });
      }
    },

    optimisticToggle: (listId, expressionId, add) => {
      set((state) => {
        state._pendingOps++;

        // savedListIds 매핑 확인
        const currentSet = state.savedListIds.get(expressionId);
        const isCurrentlyInList = currentSet?.has(listId) ?? false;

        // 멱등성 판단:
        // - 매핑이 없으면(undefined): 호출자의 의도를 신뢰 (기존 동작 유지)
        // - 매핑이 있으면: 실제 상태 변경 시에만 카운트 조정 (중복 방지)
        const shouldAdjust =
          currentSet === undefined
            ? true
            : add
              ? !isCurrentlyInList
              : isCurrentlyInList;

        const listIndex = state.lists.findIndex((l) => l.id === listId);
        if (listIndex !== -1 && shouldAdjust) {
          state.lists[listIndex].item_count = add
            ? (state.lists[listIndex].item_count || 0) + 1
            : Math.max(0, (state.lists[listIndex].item_count || 0) - 1);
        }

        // savedListIds 업데이트
        if (add) {
          if (currentSet) {
            currentSet.add(listId);
          } else {
            state.savedListIds.set(expressionId, new Set([listId]));
          }
        } else if (currentSet) {
          currentSet.delete(listId);
        }
      });
    },

    optimisticSetDefault: (listId) => {
      set((state) => {
        state._pendingOps++;
        state.lists.forEach((list) => {
          list.is_default = list.id === listId;
        });
      });
    },

    optimisticUpdateTitle: (listId, title) => {
      set((state) => {
        state._pendingOps++;
        const list = state.lists.find((l) => l.id === listId);
        if (list) list.title = title;
      });
    },

    optimisticDeleteList: (listId) => {
      set((state) => {
        state._pendingOps++;
        state.lists = state.lists.filter((l) => l.id !== listId);
      });
    },

    // 작업 완료 시: _pendingOps 감소, 모든 작업 완료 시 서버 데이터로 동기화
    resolveOperation: (serverData) => {
      set((state) => {
        state._pendingOps = Math.max(0, state._pendingOps - 1);
        if (state._pendingOps === 0 && serverData) {
          // 모든 낙관적 작업 완료 → 서버 데이터로 교체
          state.lists = serverData as VocabularyListWithCount[];
        }
      });
    },

    syncSavedListIds: (expressionId, listIds) => {
      set((state) => {
        state.savedListIds.set(expressionId, new Set(listIds));
      });
    },
  })),
);

// Selectors
export const selectLists = (state: VocabularyStore) => state.lists;

export const selectSavedListIds =
  (expressionId: string) => (state: VocabularyStore) =>
    state.savedListIds.get(expressionId) || EMPTY_SET;
