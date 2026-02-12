"use client";

import { useRef, useState, useEffect } from "react";
import { Bookmark, Loader2 } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { useAuthUser } from "@/hooks/user/useAuthUser";
import { useSaveAction } from "@/hooks/user/useSaveAction";
import {
  ActionIconSize,
  ACTION_ICON_SIZE_CLASSES,
  DEFAULT_ACTION_ICON_SIZE,
} from "@/constants/ui";
import { cn } from "@/lib/utils";
import LoginModal from "@/components/auth/LoginModal";

interface SaveButtonProps {
  expressionId: string;
  size?: ActionIconSize;
  className?: string;
}

export default function SaveButton({
  expressionId,
  size = DEFAULT_ACTION_ICON_SIZE,
  className,
}: SaveButtonProps) {
  const { isSaved, isInitialLoading, openListModal, handleSaveToggle } =
    useSaveAction(expressionId);

  const { dict } = useI18n();
  const { user } = useAuthUser();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Long Press Logic
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handlePressStart = () => {
    if (isInitialLoading) return;
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      if (user) {
        openListModal();
      }
    }, 500); // 500ms long press
  };

  const handlePressEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLongPress.current || isInitialLoading) return; // Handled by timer or loading

    const { shouldOpenLoginModal } = await handleSaveToggle();
    if (shouldOpenLoginModal) {
      setIsLoginModalOpen(true);
    }
  };

  return (
    <>
      <button
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onClick={handleClick}
        disabled={isInitialLoading}
        className={cn(
          "group flex items-center gap-1.5 transition-colors focus:outline-none sm:cursor-pointer touch-manipulation",
          isInitialLoading
            ? "cursor-wait opacity-70"
            : isSaved
              ? "text-yellow-500"
              : "text-zinc-400 hover:text-yellow-400 dark:text-zinc-500 dark:hover:text-yellow-400",
          className,
        )}
        aria-label={isSaved ? dict.detail.actionUnsave : dict.detail.actionSave}
      >
        {isInitialLoading ? (
          <Loader2
            className={cn(
              ACTION_ICON_SIZE_CLASSES[size],
              "animate-spin text-zinc-300 dark:text-zinc-600",
            )}
          />
        ) : (
          <Bookmark
            className={cn(
              ACTION_ICON_SIZE_CLASSES[size],
              isSaved && "fill-current",
              "transition-transform active:scale-90",
            )}
          />
        )}
      </button>

      <LoginModal
        isOpen={isLoginModalOpen}
        onOpenChange={setIsLoginModalOpen}
      />
    </>
  );
}
