import { ActionType, UserActionRepository } from "./UserActionRepository";
import { useLocalActionStore } from "@/store/useLocalActionStore";

// Access the store outside of React components using .getState()
// This preserves the interface while leveraging Zustand's state management
export const localUserActionRepository: UserActionRepository = {
  async getActions(type: ActionType): Promise<string[]> {
    return useLocalActionStore.getState().getActions(type);
  },

  async toggleAction(expressionId: string, type: ActionType): Promise<void> {
    useLocalActionStore.getState().toggleAction(expressionId, type);
  },

  async hasAction(expressionId: string, type: ActionType): Promise<boolean> {
    return useLocalActionStore.getState().hasAction(expressionId, type);
  },
};
