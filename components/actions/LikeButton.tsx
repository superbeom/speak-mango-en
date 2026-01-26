"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { useLocalActionStore } from "@/store/useLocalActionStore";
import { useAuthUser } from "@/hooks/user/useAuthUser";
import { useUserActions } from "@/hooks/user/useUserActions";
import {
  ActionIconSize,
  ACTION_ICON_SIZE_CLASSES,
  DEFAULT_ACTION_ICON_SIZE,
} from "@/constants/ui";
import { cn } from "@/lib/utils";
import LoginModal from "@/components/auth/LoginModal";

interface LikeButtonProps {
  expressionId: string;
  size?: ActionIconSize;
  className?: string;
}

export default function LikeButton({
  expressionId,
  size = DEFAULT_ACTION_ICON_SIZE,
  className,
}: LikeButtonProps) {
  const { dict } = useI18n();
  const { user } = useAuthUser();
  const { toggleAction, hasAction } = useUserActions();
  const [isLiked, setIsLiked] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Zustand Subscription for immediate reactivity (Guest & Pro both benefit from local optimism later)
  // For now, we only subscribe to local store for free users to get instant updates
  const localActions = useLocalActionStore((state) => state.actions.like);

  useEffect(() => {
    const checkStatus = async () => {
      // If free user, syncing with local store is enough (via subscription below)
      // If pro user, we need to check remote via hook (or sync local state too)

      if (!user) {
        setIsLiked(false);
        return;
      }

      const status = await hasAction(expressionId, "like");
      setIsLiked(status);
    };
    checkStatus();
  }, [expressionId, hasAction, localActions, user]); // Added user to dependencies

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Gate: If not logged in, show modal
    if (!user) {
      setIsModalOpen(true);
      return;
    }

    // 2. Optimistic Update (Visual)
    const newStatus = !isLiked;
    setIsLiked(newStatus); // Instant feedback

    // 3. Persist
    try {
      await toggleAction(expressionId, "like");
    } catch (error) {
      console.error("Failed to toggle like:", error);
      setIsLiked(!newStatus); // Rollback
    }
  };

  return (
    <>
      <button
        onClick={handleToggle}
        className={cn(
          "group flex items-center gap-1.5 transition-colors focus:outline-none sm:cursor-pointer",
          isLiked
            ? "text-red-500"
            : "text-zinc-400 hover:text-red-400 dark:text-zinc-500 dark:hover:text-red-400",
          className,
        )}
        aria-label={isLiked ? dict.detail.actionUnlike : dict.detail.actionLike}
      >
        <Heart
          className={cn(
            ACTION_ICON_SIZE_CLASSES[size],
            isLiked && "fill-current",
            "transition-transform active:scale-90",
          )}
        />
      </button>

      <LoginModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
