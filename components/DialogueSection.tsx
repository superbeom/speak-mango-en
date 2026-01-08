"use client";

import { useState, useRef } from "react";
import { Play, Square } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import DialogueAudioButton, {
  DialogueAudioButtonHandle,
} from "./DialogueAudioButton";

interface DialogueItem {
  en: string;
  translation: string;
  audio_url?: string;
}

interface DialogueSectionProps {
  title: string;
  dialogue: DialogueItem[];
  playAllLabel?: string;
  stopLabel?: string;
}

export default function DialogueSection({
  title,
  dialogue,
  playAllLabel = "Play All",
  stopLabel = "Stop",
}: DialogueSectionProps) {
  const isMobile = useIsMobile();
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const buttonRefs = useRef<(DialogueAudioButtonHandle | null)[]>([]);

  const handlePlayAll = () => {
    if (isAutoPlaying) {
      // Stop all
      setIsAutoPlaying(false);
      setPlayingIndex(null);
      buttonRefs.current.forEach((ref) => ref?.stop());
    } else {
      // Start from beginning
      setIsAutoPlaying(true);
      setPlayingIndex(0);
      buttonRefs.current[0]?.play();
    }
  };

  const handleLineEnded = (index: number) => {
    // Only proceed if we are in auto-play mode and this was the expected line
    if (isAutoPlaying && index === playingIndex) {
      const nextIndex = index + 1;
      if (nextIndex < dialogue.length) {
        setPlayingIndex(nextIndex);
        // Add a small delay for natural conversation flow
        setTimeout(() => {
          buttonRefs.current[nextIndex]?.play();
        }, 500);
      } else {
        // Finished
        setIsAutoPlaying(false);
        setPlayingIndex(null);
      }
    }
  };

  const handleManualPlay = (index: number) => {
    // If user manually clicks a button, we update the tracking index
    // but we might want to stop "Auto Play" sequence if they jump around.
    if (isAutoPlaying && playingIndex !== index) {
      setIsAutoPlaying(false);
    }
    setPlayingIndex(index);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="flex items-center gap-2 text-[11px] sm:text-sm font-bold uppercase tracking-wide text-zinc-400">
            {title}
          </h2>
          {/* Play All Button - Moved next to title */}
          <button
            onClick={handlePlayAll}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] sm:text-xs font-bold transition-all cursor-pointer border",
              isAutoPlaying
                ? cn(
                  "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400",
                  !isMobile &&
                  "hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/40 dark:hover:text-blue-300"
                )
                : cn(
                  "bg-white border-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400",
                  !isMobile &&
                  "hover:bg-zinc-50 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                )
            )}
          >
            {isAutoPlaying ? (
              <>
                <Square className="w-2.5 h-2.5 fill-current" />
                <span>{stopLabel}</span>
              </>
            ) : (
              <>
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>{playAllLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {dialogue.map((chat, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${idx % 2 === 0 ? "items-start" : "items-end"
              }`}
          >
            <div
              className={cn(
                "dialogue-bubble",
                idx % 2 === 0
                  ? "bg-muted text-main rounded-tl-none"
                  : "bg-blue-600 text-white rounded-tr-none",
                // Highlight active line during auto-play
                isAutoPlaying && playingIndex === idx
                  ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-white dark:ring-offset-black"
                  : ""
              )}
            >
              <div className="flex items-start gap-3">
                <p className="text-base sm:text-lg font-semibold flex-1">
                  {chat.en}
                </p>
                <DialogueAudioButton
                  ref={(el) => {
                    buttonRefs.current[idx] = el;
                  }}
                  audioUrl={chat.audio_url}
                  onEnded={() => handleLineEnded(idx)}
                  onPlay={() => handleManualPlay(idx)}
                  stopBehavior={isAutoPlaying ? "pause" : "reset"}
                  className={
                    idx % 2 === 0
                      ? "-mr-1 mt-0.5 shrink-0" // User A
                      : cn(
                        "text-blue-200 -mr-1 mt-0.5 shrink-0", // User B
                        !isMobile && "hover:text-white hover:bg-blue-500"
                      )
                  }
                  variant={idx % 2 === 0 ? "default" : "blue"}
                />
              </div>
              <p
                className={`mt-1 text-xs sm:text-sm ${idx % 2 === 0 ? "text-zinc-500" : "text-blue-100"
                  }`}
              >
                {chat.translation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
