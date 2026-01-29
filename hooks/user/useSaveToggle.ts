"use client";

import { useCallback, useState, useEffect } from "react";
import { useAppErrorHandler } from "@/hooks/useAppErrorHandler";
import { useAuthUser } from "@/hooks/user/useAuthUser";
import { useUserActions } from "@/hooks/user/useUserActions";

export function useSaveToggle(expressionId: string) {
  const { handleError } = useAppErrorHandler();
  const { user } = useAuthUser();
  const { toggleAction, hasAction } = useUserActions();
  const [isSaved, setIsSaved] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Load initial status
  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      if (!user) {
        setIsSaved(false);
        setIsInitialLoading(false);
        return;
      }
      try {
        const status = await hasAction(expressionId, "save");
        if (isMounted) {
          setIsSaved(status);
        }
      } catch (error) {
        console.error("Failed to check save status:", error);
      } finally {
        if (isMounted) setIsInitialLoading(false);
      }
    };
    checkStatus();
    return () => {
      isMounted = false;
    };
  }, [expressionId, hasAction, user]);

  const toggleSaveState = useCallback(async () => {
    if (!user) return { shouldOpenLoginModal: true };

    const willSave = !isSaved;
    setIsSaved(willSave);

    try {
      await toggleAction(expressionId, "save");
      return { shouldOpenLoginModal: false };
    } catch (error) {
      setIsSaved(!willSave); // Rollback
      handleError(error);
      throw error; // Let the caller decide
    }
  }, [user, isSaved, expressionId, toggleAction, handleError]);

  return { isSaved, toggleSaveState, setIsSaved, isInitialLoading };
}
