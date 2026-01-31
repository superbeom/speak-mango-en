"use client";

import { memo } from "react";
import { motion, useAnimation } from "framer-motion";
import { useI18n } from "@/context/I18nContext";
import { useEnableHover } from "@/hooks/useIsMobile";
import { STUDY_MODES } from "@/constants/study";
import { cn } from "@/lib/utils";
import InteractiveLink from "@/components/ui/InteractiveLink";

const StudyModeCard = memo(function StudyModeCard({
  mode,
  enableHover,
  name,
  description,
}: {
  mode: (typeof STUDY_MODES)[number];
  enableHover: boolean;
  name: string;
  description: string;
}) {
  const controls = useAnimation();

  return (
    <motion.div
      animate={controls}
      whileHover={enableHover ? { y: -4 } : undefined}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <InteractiveLink
        href={mode.href}
        isStatic={false}
        enableHover={enableHover}
        controls={controls as any}
        onClick={() => {}}
      >
        <div
          className={cn(
            "group flex flex-col h-full p-5 rounded-2xl border bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm transition-all duration-300 shadow-sm",
            mode.borderColor,
            "dark:border-zinc-800",
            enableHover &&
              cn(
                "hover:bg-white/80 dark:hover:bg-zinc-800/50 hover:shadow-md dark:hover:border-zinc-700",
                mode.shadowColor,
              ),
          )}
        >
          <div
            className={cn(
              "p-3.5 w-fit rounded-xl mb-3 transition-transform duration-300",
              enableHover && "group-hover:scale-110",
              mode.color,
            )}
          >
            <mode.icon size={24} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-zinc-900 dark:text-zinc-100 text-base sm:text-lg">
            {name}
          </span>
          <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1">
            {description}
          </span>
        </div>
      </InteractiveLink>
    </motion.div>
  );
});

StudyModeCard.displayName = "StudyModeCard";

export default function StudyModesGrid() {
  const { dict } = useI18n();
  const enableHover = useEnableHover();

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {STUDY_MODES.map((mode) => (
        <StudyModeCard
          key={mode.id}
          mode={mode}
          enableHover={enableHover}
          name={dict.me[mode.id as keyof typeof dict.me] as string}
          description={
            dict.me[`${mode.id}Desc` as keyof typeof dict.me] as string
          }
        />
      ))}
    </div>
  );
}
