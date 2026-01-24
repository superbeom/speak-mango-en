import { useMemo } from "react";
import { useAuthUser } from "@/hooks/user/useAuthUser";
import {
  ActionType,
  UserActionRepository,
} from "@/services/repositories/UserActionRepository";
import { localUserActionRepository } from "@/services/repositories/LocalUserActionRepository";
import { remoteUserActionRepository } from "@/services/repositories/RemoteUserActionRepository";

export function useUserActions() {
  const { user } = useAuthUser();

  const repository: UserActionRepository = useMemo(() => {
    if (user?.tier === "pro") {
      return remoteUserActionRepository;
    }
    return localUserActionRepository;
  }, [user?.tier]);

  const getActions = async (type: ActionType) => {
    return repository.getActions(type);
  };

  const toggleAction = async (expressionId: string, type: ActionType) => {
    return repository.toggleAction(expressionId, type);
  };

  const hasAction = async (expressionId: string, type: ActionType) => {
    return repository.hasAction(expressionId, type);
  };

  return {
    getActions,
    toggleAction,
    hasAction,
    isPro: user?.tier === "pro",
  };
}
