"use client";

import { memo } from "react";
import { motion, useAnimation } from "framer-motion";
import { useI18n } from "@/context/I18nContext";
import { StudyMode } from "@/types/study";
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
  mode: StudyMode;
  enableHover: boolean;
  name: string;
  description: string;
}) {
  const controls = useAnimation();
  const { dict } = useI18n();
  const isDisabled = mode.disabled;

  return (
    <motion.div
      animate={controls}
      whileHover={enableHover && !isDisabled ? { y: -4 } : undefined}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <InteractiveLink
        href={isDisabled ? "#" : mode.href}
        isStatic={false}
        enableHover={enableHover && !isDisabled}
        controls={controls}
        onClick={() => {}}
        className={cn(isDisabled && "cursor-default pointer-events-none")}
      >
        <div
          className={cn(
            "group relative flex flex-col h-full p-5 rounded-2xl glass-panel",
            isDisabled
              ? "opacity-60 grayscale-[0.5]"
              : cn(
                  mode.borderColor,
                  "dark:border-zinc-800",
                  enableHover && cn("glass-panel-hover", mode.shadowColor),
                ),
          )}
        >
          {isDisabled && (
            <div className="absolute top-3 right-3">
              <span className="px-2 py-0.5 rounded-full text-[10px] tracking-wider coming-soon-badge">
                {dict.common.comingSoon}
              </span>
            </div>
          )}
          <div
            className={cn(
              "p-3.5 w-fit rounded-xl mb-3 transition-transform duration-300",
              enableHover && !isDisabled && "group-hover:scale-110",
              isDisabled
                ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                : mode.color,
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
