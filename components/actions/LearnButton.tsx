"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Circle } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { useLocalActionStore } from "@/store/useLocalActionStore";
import { useAuthUser } from "@/hooks/user/useAuthUser";
import { useUserActions } from "@/hooks/user/useUserActions";
import { cn } from "@/lib/utils";
import { smoothScrollTo } from "@/lib/scroll";
import LoginModal from "@/components/auth/LoginModal";

interface LearnButtonProps {
  expressionId: string;
  className?: string;
  onLearnComplete?: () => void;
  scrollToId?: string;
}

export default function LearnButton({
  expressionId,
  className,
  onLearnComplete,
  scrollToId,
}: LearnButtonProps) {
  const { dict } = useI18n();
  const { user } = useAuthUser();
  const { toggleAction, hasAction } = useUserActions();
  const [isLearned, setIsLearned] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const localActions = useLocalActionStore((state) => state.actions.learn);

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) {
        setIsLearned(false);
        return;
      }

      const status = await hasAction(expressionId, "learn");
      setIsLearned(status);
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

    const newStatus = !isLearned;
    setIsLearned(newStatus);

    try {
      await toggleAction(expressionId, "learn");
      if (newStatus && onLearnComplete) {
        onLearnComplete();
      }

      // Auto-scroll to target section if provided
      if (newStatus && scrollToId) {
        // Slight delay to allow state updates and provide better UX
        setTimeout(() => {
          smoothScrollTo(scrollToId, 1000); // 1초 동안 부드럽게 스크롤
        }, 100);
      }
    } catch (error) {
      console.error("Failed to toggle learn:", error);
      setIsLearned(!newStatus);
    }
  };

  return (
    <>
      <button
        onClick={handleToggle}
        className={cn(
          "group flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all sm:active:scale-95 focus:outline-none sm:cursor-pointer",
          isLearned
            ? "bg-green-600 text-white hover:bg-green-700 shadow-md shadow-green-500/20"
            : "bg-white text-zinc-700 shadow-sm hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700",
          className,
        )}
      >
        {isLearned ? (
          <CheckCircle className="h-5 w-5" />
        ) : (
          <Circle className="h-5 w-5 text-zinc-400 group-hover:text-zinc-500 dark:text-zinc-500 dark:group-hover:text-zinc-400" />
        )}
        {isLearned ? dict.detail.actionLearned : dict.detail.actionLearnThis}
      </button>

      <LoginModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
