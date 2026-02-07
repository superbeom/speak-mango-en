import {
  ActionType,
  UserActionRepository,
  SyncableRepository,
} from "./UserActionRepository";
import { getUserActions } from "@/services/queries/user";
import { toggleUserAction, syncUserActions } from "@/services/actions/user";

export const remoteUserActionRepository: SyncableRepository = {
  async getActions(type: ActionType): Promise<string[]> {
    return getUserActions(type);
  },

  async toggleAction(expressionId: string, type: ActionType): Promise<void> {
    return toggleUserAction(expressionId, type);
  },

  async hasAction(expressionId: string, type: ActionType): Promise<boolean> {
    const actions = await this.getActions(type);
    return actions.includes(expressionId);
  },

  async sync(localRepo: UserActionRepository): Promise<void> {
    const types: ActionType[] = ["save", "learn"];
    const actionsToSync: { expressionId: string; type: ActionType }[] = [];

    for (const type of types) {
      const ids = await localRepo.getActions(type);
      ids.forEach((id) => {
        actionsToSync.push({ expressionId: id, type });
      });
    }

    if (actionsToSync.length > 0) {
      await syncUserActions(actionsToSync);
    }
  },
};
