import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { enableMapSet } from "immer";
import { ActionType } from "@/services/repositories/UserActionRepository";

// Immer에서 Set을 사용하기 위해 플러그인 활성화
enableMapSet();

interface UserActionStore {
  // 상태
  savedIds: Set<string>; // save 액션이 적용된 expressionId 집합
  learnedIds: Set<string>; // learn 액션이 적용된 expressionId 집합
  _pendingOps: number; // 진행 중인 낙관적 업데이트 수
  _initialized: { save: boolean; learn: boolean }; // SWR 초기 데이터 수신 여부

  // 서버 동기화용: _pendingOps === 0일 때만 적용
  syncWithServer: (type: ActionType, ids: string[]) => void;

  // 낙관적 업데이트 (_pendingOps++)
  optimisticToggle: (expressionId: string, type: ActionType) => void;

  // 작업 완료: _pendingOps--, 0이면 서버 데이터로 동기화
  resolveOperation: (type: ActionType, serverIds?: string[]) => void;

  // O(1) 조회
  has: (expressionId: string, type: ActionType) => boolean;
}

export const useUserActionStore = create<UserActionStore>()(
  immer((set, get) => ({
    savedIds: new Set(),
    learnedIds: new Set(),
    _pendingOps: 0,
    _initialized: { save: false, learn: false },

    syncWithServer: (type, ids) => {
      set((state) => {
        // 첫 호출 시 initialized 플래그 설정
        if (!state._initialized[type]) {
          state._initialized[type] = true;
        }
        // 낙관적 업데이트 진행 중이면 서버 데이터로 덮어쓰지 않음
        if (state._pendingOps > 0) return;

        const targetSet = type === "save" ? state.savedIds : state.learnedIds;
        targetSet.clear();
        ids.forEach((id) => targetSet.add(id));
      });
    },

    optimisticToggle: (expressionId, type) => {
      set((state) => {
        state._pendingOps++;
        const targetSet = type === "save" ? state.savedIds : state.learnedIds;
        if (targetSet.has(expressionId)) {
          targetSet.delete(expressionId);
        } else {
          targetSet.add(expressionId);
        }
      });
    },

    resolveOperation: (type, serverIds) => {
      set((state) => {
        state._pendingOps = Math.max(0, state._pendingOps - 1);
        if (state._pendingOps === 0 && serverIds) {
          const targetSet = type === "save" ? state.savedIds : state.learnedIds;
          targetSet.clear();
          serverIds.forEach((id) => targetSet.add(id));
        }
      });
    },

    has: (expressionId, type) => {
      const targetSet = type === "save" ? get().savedIds : get().learnedIds;
      return targetSet.has(expressionId);
    },
  })),
);
