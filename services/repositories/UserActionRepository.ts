export type ActionType = "like" | "save" | "learn";

export interface UserActionRepository {
  getActions(type: ActionType): Promise<string[]>;
  toggleAction(expressionId: string, type: ActionType): Promise<void>;
  hasAction(expressionId: string, type: ActionType): Promise<boolean>;
}

export interface SyncableRepository extends UserActionRepository {
  sync(localRepo: UserActionRepository): Promise<void>;
}
