import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ActionType } from "@/services/repositories/UserActionRepository";
import { LOCAL_STORAGE_KEYS } from "@/constants";

interface LocalActionState {
  actions: Record<ActionType, Set<string>>;
  toggleAction: (expressionId: string, type: ActionType) => void;
  getActions: (type: ActionType) => string[];
  hasAction: (expressionId: string, type: ActionType) => boolean;
}

// Set persistence helper to serialize/deserialize Set
type PersistedState = {
  actions: Record<ActionType, string[]>;
};

export const useLocalActionStore = create<LocalActionState>()(
  persist(
    (set, get) => ({
      actions: {
        like: new Set(),
        save: new Set(),
        learn: new Set(),
      },
      toggleAction: (expressionId, type) =>
        set((state) => {
          const newSet = new Set(state.actions[type]);
          if (newSet.has(expressionId)) {
            newSet.delete(expressionId);
          } else {
            newSet.add(expressionId);
          }
          return {
            actions: {
              ...state.actions,
              [type]: newSet,
            },
          };
        }),
      getActions: (type) => Array.from(get().actions[type]),
      hasAction: (expressionId, type) => get().actions[type].has(expressionId),
    }),
    {
      name: LOCAL_STORAGE_KEYS.USER_ACTIONS,
      partialize: (state) => ({
        actions: {
          like: Array.from(state.actions.like),
          save: Array.from(state.actions.save),
          learn: Array.from(state.actions.learn),
        },
      }),
      merge: (persistedState: unknown, currentState) => {
        const persisted = persistedState as PersistedState;
        return {
          ...currentState,
          actions: {
            like: new Set(persisted.actions.like || []),
            save: new Set(persisted.actions.save || []),
            learn: new Set(persisted.actions.learn || []),
          },
        };
      },
    },
  ),
);
