import { ActionType, UserActionRepository } from "./UserActionRepository";

const STORAGE_PREFIX = "mango_actions_";

const getStorageKey = (type: ActionType): string => {
  return `${STORAGE_PREFIX}${type}`;
};

const getStoredIds = (type: ActionType): Set<string> => {
  if (typeof window === "undefined") return new Set();

  const key = getStorageKey(type);
  const json = localStorage.getItem(key);

  if (!json) return new Set();
  try {
    return new Set(JSON.parse(json));
  } catch {
    return new Set();
  }
};

const saveStoredIds = (type: ActionType, ids: Set<string>): void => {
  if (typeof window === "undefined") return;
  const key = getStorageKey(type);
  localStorage.setItem(key, JSON.stringify(Array.from(ids)));
};

export const localUserActionRepository: UserActionRepository = {
  async getActions(type: ActionType): Promise<string[]> {
    return Array.from(getStoredIds(type));
  },

  async toggleAction(expressionId: string, type: ActionType): Promise<void> {
    const ids = getStoredIds(type);
    if (ids.has(expressionId)) {
      ids.delete(expressionId);
    } else {
      ids.add(expressionId);
    }
    saveStoredIds(type, ids);
  },

  async hasAction(expressionId: string, type: ActionType): Promise<boolean> {
    const ids = getStoredIds(type);
    return ids.has(expressionId);
  },
};
