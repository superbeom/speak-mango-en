"use client";

import { useAuthUser } from "@/hooks/user/useAuthUser";
import { useUserActions } from "@/hooks/user/useUserActions";
import { cn } from "@/lib/utils";
import { Bookmark } from "lucide-react";
import { useEffect, useState } from "react";
import LoginModal from "@/components/auth/LoginModal";
import { useLocalActionStore } from "@/store/useLocalActionStore";

interface SaveButtonProps {
  expressionId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function SaveButton({
  expressionId,
  size = "md",
  className,
}: SaveButtonProps) {
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

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <>
      <button
        onClick={handleToggle}
        className={cn(
          "group flex items-center gap-1.5 transition-colors focus:outline-none",
          isSaved
            ? "text-yellow-500"
            : "text-zinc-400 hover:text-yellow-400 dark:text-zinc-500 dark:hover:text-yellow-400",
          className,
        )}
        aria-label={isSaved ? "Unsave" : "Save"}
      >
        <Bookmark
          className={cn(
            sizeClasses[size],
            isSaved && "fill-current",
            "transition-transform active:scale-90",
          )}
        />
      </button>

      <LoginModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
