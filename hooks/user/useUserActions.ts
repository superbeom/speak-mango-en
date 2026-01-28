import { useMemo, useCallback } from "react";
import { useAuthUser } from "@/hooks/user/useAuthUser";
import {
  ActionType,
  UserActionRepository,
} from "@/services/repositories/UserActionRepository";
import { localUserActionRepository } from "@/services/repositories/LocalUserActionRepository";
import { remoteUserActionRepository } from "@/services/repositories/RemoteUserActionRepository";

export function useUserActions() {
  const { isPro } = useAuthUser();

  const repository: UserActionRepository = useMemo(() => {
    if (isPro) {
      return remoteUserActionRepository;
    }
    return localUserActionRepository;
  }, [isPro]);

  const getActions = useCallback(
    async (type: ActionType) => {
      return repository.getActions(type);
    },
    [repository],
  );

  const toggleAction = useCallback(
    async (expressionId: string, type: ActionType) => {
      return repository.toggleAction(expressionId, type);
    },
    [repository],
  );

  const hasAction = useCallback(
    async (expressionId: string, type: ActionType) => {
      return repository.hasAction(expressionId, type);
    },
    [repository],
  );

  return {
    getActions,
    toggleAction,
    hasAction,
    isPro,
  };
}
