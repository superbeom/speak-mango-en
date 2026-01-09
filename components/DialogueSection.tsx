"use client";

import { useState, useRef, useCallback } from "react";
import { Play, Square, Loader2, Headphones, Eye, EyeOff } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import { DialogueAudioButtonHandle } from "./DialogueAudioButton";
import DialogueItem from "./DialogueItem";

interface LearningToggleProps {
  isActive: boolean;
  isDisabled?: boolean;
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  isMobile: boolean;
  activeColor?: string; // Optional if we want different active colors in future
}

function LearningToggle({
  isActive,
  isDisabled,
  onClick,
  title,
  icon,
  isMobile,
}: LearningToggleProps) {
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "p-1.5 rounded-full transition-all border cursor-pointer",
        isDisabled
          ? "opacity-50 cursor-not-allowed bg-zinc-50 border-zinc-100 text-zinc-300 dark:bg-zinc-800/50 dark:border-zinc-800 dark:text-zinc-600"
          : isActive
            ? "bg-highlight border-highlight text-highlight"
            : cn(
              "bg-white border-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-500",
              !isMobile && "hover:text-zinc-600 dark:hover:text-zinc-300"
            )
      )}
      title={title}
    >
      {icon}
    </button>
  );
}


interface DialogueItemData {
  en: string;
  translation: string;
  audio_url?: string;
}

interface DialogueSectionProps {
  title: string;
  dialogue: DialogueItemData[];
  playAllLabel?: string;
  stopLabel?: string;
  loadingLabel?: string;
}

export default function DialogueSection({
  title,
  dialogue,
  playAllLabel = "Play All",
  stopLabel = "Stop",
  loadingLabel = "Loading...",
}: DialogueSectionProps) {
  const isMobile = useIsMobile();
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const buttonRefs = useRef<(DialogueAudioButtonHandle | null)[]>([]);

  // Learning Mode States
  const [isBlindMode, setIsBlindMode] = useState(true);
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());

  const isAllRevealed = dialogue.length > 0 && revealedIndices.size === dialogue.length;

  const handleToggleShowAll = () => {
    if (isAllRevealed) {
      setRevealedIndices(new Set());
    } else {
      setRevealedIndices(new Set(dialogue.map((_, i) => i)));
    }
  };

  const handleManualToggle = (index: number) => {
    if (isBlindMode) return;
    setRevealedIndices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // State to track ready status of each audio
  const [readyIndices, setReadyIndices] = useState<Set<number>>(new Set());

  // Count items that have audio_url
  const totalAudioCount = dialogue.filter((item) => item.audio_url).length;
  const isAllReady = readyIndices.size >= totalAudioCount && totalAudioCount > 0;

  const handleAudioReady = useCallback((index: number) => {
    setReadyIndices((prev) => {
      const newSet = new Set(prev);
      newSet.add(index);
      return newSet;
    });
  }, []);

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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-y-2">
        <div className="flex items-center gap-3">
          <h2 className="flex items-center gap-2 text-[11px] sm:text-sm font-bold uppercase tracking-wide text-zinc-400">
            {title}
          </h2>
          {/* Play All Button */}
          <button
            onClick={handlePlayAll}
            disabled={!isAllReady}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] sm:text-xs font-bold transition-all cursor-pointer border",
              !isAllReady
                ? "bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-500"
                : isAutoPlaying
                  ? cn(
                    "bg-highlight border-highlight text-highlight",
                    !isMobile &&
                    "hover-bg-highlight hover-text-highlight"
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
            ) : !isAllReady ? (
              <>
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                <span>{loadingLabel}</span>
              </>
            ) : (
              <>
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>{playAllLabel}</span>
              </>
            )}
          </button>
        </div>

        {/* Learning Mode Controls */}
        <div className="flex items-center gap-2">
          <LearningToggle
            isActive={isBlindMode}
            onClick={() => setIsBlindMode((prev) => !prev)}
            title="Blind Listening Mode (Hide Text)"
            icon={<Headphones className="w-3.5 h-3.5" />}
            isMobile={!!isMobile}
          />

          <LearningToggle
            isActive={isAllRevealed}
            isDisabled={isBlindMode}
            onClick={handleToggleShowAll}
            title={isAllRevealed ? "Hide Translations" : "Show Translations"}
            icon={isAllRevealed ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            isMobile={!!isMobile}
          />
        </div>
      </div>

      <div className="space-y-4">
        {dialogue.map((chat, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${idx % 2 === 0 ? "items-start" : "items-end"}`}
          >
            <DialogueItem
              ref={(el) => {
                buttonRefs.current[idx] = el;
              }}
              item={chat}
              isBlindMode={isBlindMode}
              isTranslationRevealed={revealedIndices.has(idx)}
              onToggleReveal={() => handleManualToggle(idx)}
              variant={idx % 2 === 0 ? "default" : "blue"}
              onPlay={() => handleManualPlay(idx)}
              onEnded={() => handleLineEnded(idx)}
              onReady={() => handleAudioReady(idx)}
              isActive={isAutoPlaying && playingIndex === idx}
              isMobile={!!isMobile}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
