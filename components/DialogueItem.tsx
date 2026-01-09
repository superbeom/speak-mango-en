"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import DialogueAudioButton, { DialogueAudioButtonHandle } from "./DialogueAudioButton";

interface DialogueItemProps {
    item: {
        en: string;
        translation: string;
        audio_url?: string;
    };
    isBlindMode: boolean;
    isTranslationRevealed: boolean;
    onToggleReveal: () => void;
    variant: "default" | "blue";
    onPlay: () => void;
    onEnded: () => void;
    onReady: () => void;
    isActive: boolean;
    isMobile: boolean;
}

const DialogueItem = forwardRef<DialogueAudioButtonHandle, DialogueItemProps>(
    (
        {
            item,
            isBlindMode,
            isTranslationRevealed,
            onToggleReveal,
            variant,
            onPlay,
            onEnded,
            onReady,
            isActive,
            isMobile,
        },
        ref
    ) => {
        const handleTranslationClick = () => {
            if (isBlindMode) return; // Do nothing in blind mode
            onToggleReveal();
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
                            isBlindMode ? "blur-xs select-none text-zinc-300 dark:text-zinc-600 cursor-default" : "blur-0"
                        )}
                        aria-hidden={isBlindMode}
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
                    />
                </div>

                {/* Translation Area */}
                <div
                    className={cn(
                        "mt-1 transition-all duration-300",
                        isBlindMode ? "blur-md select-none opacity-60 cursor-default" : "blur-0"
                    )}
                    aria-hidden={isBlindMode}
                >
                    <p
                        onClick={handleTranslationClick}
                        className={cn(
                            "text-xs sm:text-sm transition-all duration-300 select-none",
                            !isBlindMode ? "cursor-pointer" : "cursor-default",
                            variant === "default" ? "text-zinc-500" : "text-blue-100",
                            !isBlindMode && !isTranslationRevealed && "blur-[3px]"
                        )}
                        title={isTranslationRevealed ? "Click to blur" : "Click to reveal"}
                    >
                        {item.translation}
                    </p>
                </div>
            </div>
        );
    }
);

DialogueItem.displayName = "DialogueItem";

export default DialogueItem;
