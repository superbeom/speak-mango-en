"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import DialogueAudioButton, {
  DialogueAudioButtonHandle,
} from "./DialogueAudioButton";

interface DialogueItemProps {
  item: {
    en: string;
    translation: string;
    audio_url?: string;
  };
  isEnglishBlurred: boolean;
  isTranslationBlurred: boolean;
  canClickTranslation: boolean;
  onToggleReveal: () => void;
  onEnglishClick: () => void;
  variant: "default" | "blue";
  onPlay: () => void;
  onEnded: () => void;
  onReady: () => void;
  isActive: boolean;
  isMobile: boolean;
  // Analytics props
  isAutoPlaying?: boolean; // Play All 모드 여부
  expressionId?: string;
  audioIndex?: number;
}

const DialogueItem = forwardRef<DialogueAudioButtonHandle, DialogueItemProps>(
  (
    {
      item,
      isEnglishBlurred,
      isTranslationBlurred,
      canClickTranslation,
      onToggleReveal,
      onEnglishClick,
      variant,
      onPlay,
      onEnded,
      onReady,
      isActive,
      isMobile,
      isAutoPlaying = false,
      expressionId,
      audioIndex,
    },
    ref
  ) => {
    const handleTranslationClick = () => {
      if (!canClickTranslation) return; // Only block if strictly forbidden (strict blind mode)
      onToggleReveal();
    };

    const handleEnglishClick = () => {
      // Only allow click if it is currently blurred (Blind/Partial mode)
      if (isEnglishBlurred) {
        onEnglishClick();
      }
    };

    return (
      <div
        className={cn(
          "dialogue-bubble transition-all duration-300",
          variant === "default"
            ? "bg-muted text-main rounded-tl-none"
            : "bg-blue-600 text-white rounded-tr-none",
          isActive
            ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-white dark:ring-offset-black"
            : ""
        )}
      >
        <div className="flex items-start gap-3">
          <p
            className={cn(
              "text-base sm:text-lg font-semibold flex-1 transition-all duration-300",
              isEnglishBlurred
                ? cn(
                    "blur-xs select-none cursor-pointer",
                    variant === "default" ? "text-disabled" : "text-blue-200/70"
                  )
                : "blur-0"
            )}
            onClick={handleEnglishClick}
            title={isEnglishBlurred ? "Click to reveal" : ""}
            aria-hidden={isEnglishBlurred}
          >
            {item.en}
          </p>
          <DialogueAudioButton
            ref={ref}
            audioUrl={item.audio_url}
            onEnded={onEnded}
            onPlay={onPlay}
            stopBehavior={isActive ? "pause" : "reset"}
            className={
              variant === "default"
                ? "-mr-1 mt-0.5 shrink-0"
                : cn(
                    "text-blue-200 -mr-1 mt-0.5 shrink-0",
                    !isMobile && "hover:text-white hover:bg-blue-500"
                  )
            }
            variant={variant}
            onReady={onReady}
            isAutoPlaying={isAutoPlaying}
            expressionId={expressionId}
            audioIndex={audioIndex}
            playType="individual"
          />
        </div>

        {/* Translation Area */}
        {item.translation && (
          <div
            className={cn(
              "mt-1 transition-all duration-300",
              isTranslationBlurred ? "blur-[3px] select-none" : "blur-0",
              // Request 2: If blurred (and likely in blind mode), show as disabled pointer or default?
              // If it's pure blind mode, we blocked click above.
              isTranslationBlurred &&
                isEnglishBlurred &&
                "opacity-60 cursor-default"
            )}
            aria-hidden={isTranslationBlurred}
          >
            <p
              onClick={handleTranslationClick}
              className={cn(
                "text-xs sm:text-sm transition-all duration-300 select-none",
                // Use canClickTranslation to determine cursor.
                // If exposed (!blurred), it's pointer.
                // If blurred, check canClickTranslation: if true (Partial), pointer. If false (Strict), default.
                !isTranslationBlurred || canClickTranslation
                  ? "cursor-pointer"
                  : "cursor-default",
                variant === "default" ? "text-zinc-500" : "text-blue-100"
              )}
              title={isTranslationBlurred ? "Hidden" : "Click to blur"}
            >
              {item.translation}
            </p>
          </div>
        )}
      </div>
    );
  }
);

DialogueItem.displayName = "DialogueItem";

export default DialogueItem;
