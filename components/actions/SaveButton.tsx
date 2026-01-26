"use client";

import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
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
  const { dict } = useI18n();
  const { user } = useAuthUser();
  const { toggleAction, hasAction } = useUserActions();
  const [isSaved, setIsSaved] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const localActions = useLocalActionStore((state) => state.actions.save);

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) {
        setIsSaved(false);
        return;
      }

      const status = await hasAction(expressionId, "save");
      setIsSaved(status);
    };
    checkStatus();
  }, [expressionId, hasAction, localActions, user]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      setIsModalOpen(true);
      return;
    }

    const newStatus = !isSaved;
    setIsSaved(newStatus);

    try {
      await toggleAction(expressionId, "save");
    } catch (error) {
      console.error("Failed to toggle save:", error);
      setIsSaved(!newStatus);
    }
  };

  return (
    <>
      <button
        onClick={handleToggle}
        className={cn(
          "group flex items-center gap-1.5 transition-colors focus:outline-none sm:cursor-pointer",
          isSaved
            ? "text-yellow-500"
            : "text-zinc-400 hover:text-yellow-400 dark:text-zinc-500 dark:hover:text-yellow-400",
          className,
        )}
        aria-label={isSaved ? dict.detail.actionUnsave : dict.detail.actionSave}
      >
        <Bookmark
          className={cn(
            ACTION_ICON_SIZE_CLASSES[size],
            isSaved && "fill-current",
            "transition-transform active:scale-90",
          )}
        />
      </button>

      <LoginModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
