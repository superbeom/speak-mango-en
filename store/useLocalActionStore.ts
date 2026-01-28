import { create } from "zustand";
import { persist } from "zustand/middleware";
import { LOCAL_STORAGE_KEYS } from "@/constants";
import { ActionType } from "@/services/repositories/UserActionRepository";

// Vocabulary Types for Local Store
export interface LocalVocabularyList {
  id: string;
  title: string;
  itemIds: Set<string>;
  created_at: string;
}

interface LocalActionState {
  actions: Record<ActionType, Set<string>>;
  vocabularyLists: Record<string, LocalVocabularyList>; // Keyed by ID

  toggleAction: (expressionId: string, type: ActionType) => void;
  getActions: (type: ActionType) => string[];
  hasAction: (expressionId: string, type: ActionType) => boolean;

  // Vocabulary Actions
  createList: (title: string) => string; // Returns new ID
  deleteList: (id: string) => void;
  addToList: (listId: string, expressionId: string) => void;
  removeFromList: (listId: string, expressionId: string) => void;
  getLists: () => LocalVocabularyList[];
  getListIdsForExpression: (expressionId: string) => string[];
}

// Set persistence helper to serialize/deserialize Set
type PersistedState = {
  actions: Record<ActionType, string[]>;
  vocabularyLists: Record<
    string,
    {
      id: string;
      title: string;
      items: string[];
      created_at: string;
    }
  >;
};

export const useLocalActionStore = create<LocalActionState>()(
  persist(
    (set, get) => ({
      actions: {
        save: new Set(),
        learn: new Set(),
      },
      vocabularyLists: {},

      toggleAction: (expressionId, type) =>
        set((state) => {
          const newSet = new Set(state.actions[type]);
          if (newSet.has(expressionId)) {
            newSet.delete(expressionId);
            // Optional: If unsaving, remove from default list?
            // For now, keep logic simple: Action is just a flag.
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

      // Vocabulary Implementation
      createList: (title) => {
        const id = crypto.randomUUID();
        const newList: LocalVocabularyList = {
          id,
          title,
          itemIds: new Set(),
          created_at: new Date().toISOString(),
        };
        set((state) => ({
          vocabularyLists: { ...state.vocabularyLists, [id]: newList },
        }));
        return id;
      },
      deleteList: (id) =>
        set((state) => {
          const newLists = { ...state.vocabularyLists };
          delete newLists[id];
          return { vocabularyLists: newLists };
        }),
      addToList: (listId, expressionId) =>
        set((state) => {
          const list = state.vocabularyLists[listId];
          if (!list) return {};
          const newSet = new Set(list.itemIds).add(expressionId);
          return {
            vocabularyLists: {
              ...state.vocabularyLists,
              [listId]: { ...list, itemIds: newSet },
            },
          };
        }),
      removeFromList: (listId, expressionId) =>
        set((state) => {
          const list = state.vocabularyLists[listId];
          if (!list) return {};
          const newSet = new Set(list.itemIds);
          newSet.delete(expressionId);
          return {
            vocabularyLists: {
              ...state.vocabularyLists,
              [listId]: { ...list, itemIds: newSet },
            },
          };
        }),
      getLists: () =>
        Object.values(get().vocabularyLists).sort((a, b) =>
          a.created_at.localeCompare(b.created_at),
        ),
      getListIdsForExpression: (expressionId) =>
        Object.values(get().vocabularyLists)
          .filter((list) => list.itemIds.has(expressionId))
          .map((list) => list.id),
    }),
    {
      name: LOCAL_STORAGE_KEYS.USER_ACTIONS,
      partialize: (state) => ({
        actions: {
          save: Array.from(state.actions.save),
          learn: Array.from(state.actions.learn),
        },
        vocabularyLists: Object.fromEntries(
          Object.entries(state.vocabularyLists).map(([id, list]) => [
            id,
            { ...list, items: Array.from(list.itemIds) },
          ]),
        ),
      }),
      merge: (persistedState: unknown, currentState) => {
        const persisted = persistedState as PersistedState;

        // Rehydrate vocabulary lists ensuring Sets are recreated
        const rehydratedLists: Record<string, LocalVocabularyList> = {};
        if (persisted.vocabularyLists) {
          Object.entries(persisted.vocabularyLists).forEach(([id, list]) => {
            rehydratedLists[id] = {
              ...list,
              itemIds: new Set(list.items || []),
            };
          });
        }

        return {
          ...currentState,
          actions: {
            save: new Set(persisted.actions.save || []),
            learn: new Set(persisted.actions.learn || []),
          },
          vocabularyLists: rehydratedLists,
        };
      },
    },
  ),
);
