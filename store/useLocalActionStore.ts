import { create } from "zustand";
import { persist } from "zustand/middleware";
import { LOCAL_STORAGE_KEYS } from "@/constants";
import { ActionType } from "@/services/repositories/UserActionRepository";

// Vocabulary Types for Local Store
export interface LocalVocabularyList {
  id: string;
  title: string;
  itemIds: Set<string>;
  itemTimestamps: Record<string, number>; // <expressionId, timestamp>
  createdAt: string;
  isDefault?: boolean;
}

interface LocalActionState {
  actions: Record<ActionType, Set<string>>;
  actionTimestamps: Record<string, number>; // "type:expressionId" -> timestamp
  vocabularyLists: Record<string, LocalVocabularyList>; // Keyed by ID

  toggleAction: (expressionId: string, type: ActionType) => void;
  getActions: (type: ActionType) => string[];
  hasAction: (expressionId: string, type: ActionType) => boolean;

  // Vocabulary Actions
  createList: (title: string) => string; // Returns new ID
  deleteList: (id: string) => void;
  addToList: (listId: string, expressionId: string) => void;
  addMultipleToList: (listId: string, expressionIds: string[]) => void;
  removeFromList: (listId: string, expressionId: string) => void;
  removeMultipleFromList: (listId: string, expressionIds: string[]) => void;
  getLists: () => LocalVocabularyList[];
  getListIdsForExpression: (expressionId: string) => string[];
  setDefaultList: (listId: string) => void;
  updateListTitle: (id: string, newTitle: string) => void;

  // Hydration State
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

// Set persistence helper to serialize/deserialize Set
type PersistedState = {
  actions: Record<ActionType, string[]>;
  actionTimestamps: Record<string, number>;
  vocabularyLists: Record<
    string,
    {
      id: string;
      title: string;
      items: string[];
      itemTimestamps: Record<string, number>;
      createdAt: string;
      isDefault?: boolean;
    }
  >;
};

export const useLocalActionStore = create<LocalActionState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      actions: {
        save: new Set(),
        learn: new Set(),
      },
      actionTimestamps: {},
      vocabularyLists: {},

      toggleAction: (expressionId, type) =>
        set((state) => {
          const newSet = new Set(state.actions[type]);
          const newTimestamps = { ...state.actionTimestamps };
          const timestampKey = `${type}:${expressionId}`;

          if (newSet.has(expressionId)) {
            newSet.delete(expressionId);
            delete newTimestamps[timestampKey];
          } else {
            newSet.add(expressionId);
            newTimestamps[timestampKey] = Date.now();
          }
          return {
            actions: {
              ...state.actions,
              [type]: newSet,
            },
            actionTimestamps: newTimestamps,
          };
        }),
      getActions: (type) => {
        const ids = Array.from(get().actions[type]);
        const timestamps = get().actionTimestamps;
        return ids.sort((a, b) => {
          const tsA = timestamps[`${type}:${a}`] || 0;
          const tsB = timestamps[`${type}:${b}`] || 0;
          return tsB - tsA; // Latest first
        });
      },
      hasAction: (expressionId, type) => get().actions[type].has(expressionId),

      // Vocabulary Implementation
      createList: (title) => {
        const id = crypto.randomUUID();
        const isFirstList = Object.keys(get().vocabularyLists).length === 0;
        const newList: LocalVocabularyList = {
          id,
          title,
          itemIds: new Set(),
          itemTimestamps: {},
          createdAt: new Date().toISOString(),
          isDefault: isFirstList,
        };
        set((state) => ({
          vocabularyLists: { ...state.vocabularyLists, [id]: newList },
        }));
        return id;
      },
      deleteList: (id) =>
        set((state) => {
          const newLists = { ...state.vocabularyLists };
          const wasDefault = newLists[id]?.isDefault;
          delete newLists[id];

          // If the deleted list was default, reassign default to the oldest list
          if (wasDefault) {
            const remainingLists = Object.values(newLists).sort((a, b) =>
              a.createdAt.localeCompare(b.createdAt),
            );

            if (remainingLists.length > 0) {
              const newDefault = remainingLists[0];
              newLists[newDefault.id] = { ...newDefault, isDefault: true };
            }
          }

          return { vocabularyLists: newLists };
        }),
      addToList: (listId, expressionId) =>
        set((state) => {
          const list = state.vocabularyLists[listId];
          if (!list) return {};
          const newSet = new Set(list.itemIds).add(expressionId);
          const newTimestamps = {
            ...list.itemTimestamps,
            [expressionId]: Date.now(),
          };
          return {
            vocabularyLists: {
              ...state.vocabularyLists,
              [listId]: {
                ...list,
                itemIds: newSet,
                itemTimestamps: newTimestamps,
              },
            },
          };
        }),
      addMultipleToList: (listId, expressionIds) =>
        set((state) => {
          const list = state.vocabularyLists[listId];
          if (!list) return {};
          const newSet = new Set(list.itemIds);
          const newTimestamps = { ...list.itemTimestamps };
          const now = Date.now();
          expressionIds.forEach((id) => {
            newSet.add(id);
            newTimestamps[id] = now;
          });
          return {
            vocabularyLists: {
              ...state.vocabularyLists,
              [listId]: {
                ...list,
                itemIds: newSet,
                itemTimestamps: newTimestamps,
              },
            },
          };
        }),
      removeFromList: (listId, expressionId) =>
        set((state) => {
          const list = state.vocabularyLists[listId];
          if (!list) return {};
          const newSet = new Set(list.itemIds);
          newSet.delete(expressionId);
          const newTimestamps = { ...list.itemTimestamps };
          delete newTimestamps[expressionId];
          return {
            vocabularyLists: {
              ...state.vocabularyLists,
              [listId]: {
                ...list,
                itemIds: newSet,
                itemTimestamps: newTimestamps,
              },
            },
          };
        }),
      removeMultipleFromList: (listId, expressionIds) =>
        set((state) => {
          const list = state.vocabularyLists[listId];
          if (!list) return {};
          const newSet = new Set(list.itemIds);
          const newTimestamps = { ...list.itemTimestamps };
          expressionIds.forEach((id) => {
            newSet.delete(id);
            delete newTimestamps[id];
          });
          return {
            vocabularyLists: {
              ...state.vocabularyLists,
              [listId]: {
                ...list,
                itemIds: newSet,
                itemTimestamps: newTimestamps,
              },
            },
          };
        }),
      getLists: () =>
        Object.values(get().vocabularyLists).sort((a, b) => {
          if (a.isDefault && !b.isDefault) return -1;
          if (!a.isDefault && b.isDefault) return 1;
          return a.createdAt.localeCompare(b.createdAt);
        }),
      getListIdsForExpression: (expressionId) =>
        Object.values(get().vocabularyLists)
          .filter((list) => list.itemIds.has(expressionId))
          .map((list) => list.id),
      setDefaultList: (targetListId: string) =>
        set((state) => {
          const newLists = Object.entries(state.vocabularyLists).reduce(
            (acc, [id, list]) => {
              acc[id] = {
                ...list,
                isDefault: id === targetListId,
              };
              return acc;
            },
            {} as Record<string, LocalVocabularyList>,
          );
          return { vocabularyLists: newLists };
        }),
      updateListTitle: (id, newTitle) =>
        set((state) => {
          const list = state.vocabularyLists[id];
          if (!list) return {};
          return {
            vocabularyLists: {
              ...state.vocabularyLists,
              [id]: { ...list, title: newTitle },
            },
          };
        }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: LOCAL_STORAGE_KEYS.USER_ACTIONS,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        actions: {
          save: Array.from(state.actions.save),
          learn: Array.from(state.actions.learn),
        },
        actionTimestamps: state.actionTimestamps,
        vocabularyLists: Object.fromEntries(
          Object.entries(state.vocabularyLists).map(([id, list]) => [
            id,
            {
              ...list,
              items: Array.from(list.itemIds),
              itemTimestamps: list.itemTimestamps,
              isDefault: list.isDefault,
            },
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
              itemTimestamps: list.itemTimestamps || {},
              isDefault: list.isDefault,
              createdAt: list.createdAt,
            };
          });
        }

        return {
          ...currentState,
          actions: {
            save: new Set(persisted.actions.save || []),
            learn: new Set(persisted.actions.learn || []),
          },
          actionTimestamps: persisted.actionTimestamps || {},
          vocabularyLists: rehydratedLists,
          _hasHydrated: true,
        };
      },
    },
  ),
);
