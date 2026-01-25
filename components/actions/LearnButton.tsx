"use client";

import { useAuthUser } from "@/hooks/user/useAuthUser";
import { useUserActions } from "@/hooks/user/useUserActions";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import LoginModal from "@/components/auth/LoginModal";
import { useLocalActionStore } from "@/store/useLocalActionStore";

interface LearnButtonProps {
  expressionId: string;
  className?: string;
  onLearnComplete?: () => void;
}

export default function LearnButton({
  expressionId,
  className,
  onLearnComplete,
}: LearnButtonProps) {
  const { user } = useAuthUser();
  const { toggleAction, hasAction } = useUserActions();
  const [isLearned, setIsLearned] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const localActions = useLocalActionStore((state) => state.actions.learn);

  useEffect(() => {
    const checkStatus = async () => {
      const status = await hasAction(expressionId, "learn");
      setIsLearned(status);
    };
    checkStatus();
  }, [expressionId, hasAction, localActions]);

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
          "flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2",
          isLearned
            ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 ring-green-500/20"
            : "bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg shadow-zinc-500/10 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:shadow-none focus:ring-zinc-900 dark:focus:ring-zinc-50",
          className,
        )}
      >
        <CheckCircle2
          className={cn(
            "h-5 w-5",
            isLearned ? "fill-current" : "stroke-current",
          )}
        />
        {isLearned ? "Learned!" : "I learned this!"}
      </button>

      <LoginModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
