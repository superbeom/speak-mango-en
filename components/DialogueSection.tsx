"use client";

import { useState, useRef, useCallback } from "react";
import { Play, Square, Loader2, Headphones, Eye, EyeOff } from "lucide-react";
import { trackLearningModeToggle, trackAudioPlay } from "@/analytics";
import { DialogueItem as DialogueItemType } from "@/types/database";
import { useIsMobile } from "@/hooks/useIsMobile";
import { SupportedLanguage } from "@/i18n";
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

interface DialogueSectionProps {
  title: string;
  dialogue: DialogueItemType[];
  locale: string;
  expressionId: string; // Analytics용 표현 ID
  playAllLabel?: string;
  stopLabel?: string;
  loadingLabel?: string;
}

function LearningToggle({
  isActive,
  isDisabled,
  isSoftDisabled,
  onClick,
  title,
  icon,
  isMobile,
}: LearningToggleProps & { isSoftDisabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "p-1.5 rounded-full transition-all border cursor-pointer",
        isDisabled
          ? "opacity-50 cursor-not-allowed bg-zinc-50 border-zinc-100 text-disabled dark:bg-zinc-800/50 dark:border-zinc-800"
          : isSoftDisabled
          ? "bg-zinc-50 border-zinc-200 text-disabled dark:bg-zinc-800/50 dark:border-zinc-700"
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

export default function DialogueSection({
  title,
  dialogue,
  locale,
  expressionId,
  playAllLabel = "Play All",
  stopLabel = "Stop",
  loadingLabel = "Loading...",
}: DialogueSectionProps) {
  const isMobile = useIsMobile();
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const buttonRefs = useRef<(DialogueAudioButtonHandle | null)[]>([]);

  // Learning Mode States: 'blind' (default) | 'partial' (one clicked) | 'exposed' (all shown)
  const [viewMode, setViewMode] = useState<"blind" | "partial" | "exposed">(
    "blind"
  );
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(
    new Set()
  );
  const [savedRevealedIndices, setSavedRevealedIndices] =
    useState<Set<number> | null>(null);
  const [revealedEnglishIndices, setRevealedEnglishIndices] = useState<
    Set<number>
  >(new Set());

  // Use saved indices for icon state if we are in blind/partial mode
  const effectiveRevealedIndices =
    viewMode !== "exposed" && savedRevealedIndices
      ? savedRevealedIndices
      : revealedIndices;
  const isAllRevealed =
    dialogue.length > 0 && effectiveRevealedIndices.size === dialogue.length;

  // Toggle Translation Visibility (Eye Icon)
  const handleToggleShowAll = () => {
    // If we are in blind/partial mode, this button acts as "Exit Blind Mode" first
    if (viewMode !== "exposed") {
      setViewMode("exposed");
      if (savedRevealedIndices) {
        setRevealedIndices(savedRevealedIndices);
        setSavedRevealedIndices(null);
      }
      return;
    }

    // Normal behavior when in exposed mode
    if (isAllRevealed) {
      setRevealedIndices(new Set());
      // 해석 숨기기
      trackLearningModeToggle({
        mode: "translation_blur",
        action: "enable",
      });
    } else {
      setRevealedIndices(new Set(dialogue.map((_, i) => i)));
      // 해석 모두 보기
      trackLearningModeToggle({
        mode: "translation_blur",
        action: "disable",
      });
    }
  };

  const handleManualToggle = (index: number) => {
    // Disable translation click interaction only in strict blind mode
    // (Partial blind mode allows clicking translations)
    if (viewMode === "blind") return;

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

  const handleEnglishClick = (index: number) => {
    if (viewMode === "exposed") return;

    // Calculate new set immediately to check size
    const newEnglishSet = new Set(revealedEnglishIndices);
    newEnglishSet.add(index);
    setRevealedEnglishIndices(newEnglishSet);

    // If all English is now revealed, perform "Auto-Exit Blind Mode"
    if (newEnglishSet.size === dialogue.length) {
      setViewMode("exposed");
      setSavedRevealedIndices(null); // Discard saved state (user manually overrode context)
    } else if (viewMode === "blind") {
      setViewMode("partial");
    }
  };

  // State to track ready status of each audio
  const [readyIndices, setReadyIndices] = useState<Set<number>>(new Set());

  // Count items that have audio_url
  const totalAudioCount = dialogue.filter((item) => item.audio_url).length;
  const isAllReady =
    readyIndices.size >= totalAudioCount && totalAudioCount > 0;

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
      // Pass true to indicate this is sequential playback
      buttonRefs.current[0]?.play(true);

      // Track Play All event
      trackAudioPlay({
        expressionId,
        audioIndex: 0,
        playType: "sequential",
      });
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
          // Pass true to indicate this is sequential playback
          buttonRefs.current[nextIndex]?.play(true);
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
                    !isMobile && "hover-bg-highlight hover-text-highlight"
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
            isActive={viewMode === "blind"}
            onClick={() => {
              if (viewMode === "blind") {
                // Exit Blind Mode -> Restore State
                setViewMode("exposed");
                if (savedRevealedIndices) {
                  setRevealedIndices(savedRevealedIndices);
                  setSavedRevealedIndices(null);
                }
                // Blind Listening 비활성화
                trackLearningModeToggle({
                  mode: "blind_listening",
                  action: "disable",
                });
              } else if (viewMode === "exposed") {
                // Enter Blind Mode -> Save State and Clear
                setSavedRevealedIndices(revealedIndices);
                setRevealedIndices(new Set());
                setRevealedEnglishIndices(new Set());
                setViewMode("blind");
                // Blind Listening 활성화
                trackLearningModeToggle({
                  mode: "blind_listening",
                  action: "enable",
                });
              } else {
                // Partial Mode -> Re-enter Strict Blind (Clear individual reveals)
                // (Don't overwrite saved indices, keep original save)
                setRevealedIndices(new Set());
                setRevealedEnglishIndices(new Set());
                setViewMode("blind");
                // Blind Listening 재활성화
                trackLearningModeToggle({
                  mode: "blind_listening",
                  action: "enable",
                });
              }
            }}
            title="Blind Listening Mode (Hide Text)"
            icon={<Headphones className="w-3.5 h-3.5" />}
            isMobile={!!isMobile}
          />

          {locale !== SupportedLanguage.EN && (
            <LearningToggle
              isActive={isAllRevealed}
              // Request 2: "Soft Disabled" look if in Blind/Partial mode
              isSoftDisabled={viewMode !== "exposed"}
              onClick={handleToggleShowAll}
              title={isAllRevealed ? "Hide Translations" : "Show Translations"}
              icon={
                isAllRevealed ? (
                  <Eye className="w-3.5 h-3.5" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )
              }
              isMobile={!!isMobile}
            />
          )}
        </div>
      </div>

      <div className="space-y-4">
        {dialogue.map((chat, idx) => {
          const resolvedItem = {
            en: chat.en,
            translation: chat.translations[locale] || "",
            audio_url: chat.audio_url,
          };

          return (
            <div
              key={idx}
              className={`flex flex-col ${
                idx % 2 === 0 ? "items-start" : "items-end"
              }`}
            >
              <DialogueItem
                ref={(el) => {
                  buttonRefs.current[idx] = el;
                }}
                item={resolvedItem}
                isEnglishBlurred={
                  viewMode === "blind" ||
                  (viewMode === "partial" && !revealedEnglishIndices.has(idx))
                }
                isTranslationBlurred={
                  viewMode === "blind" || !revealedIndices.has(idx)
                }
                canClickTranslation={viewMode !== "blind"}
                onToggleReveal={() => handleManualToggle(idx)}
                onEnglishClick={() => handleEnglishClick(idx)}
                variant={idx % 2 === 0 ? "default" : "blue"}
                onPlay={() => handleManualPlay(idx)}
                onEnded={() => handleLineEnded(idx)}
                onReady={() => handleAudioReady(idx)}
                isActive={isAutoPlaying && playingIndex === idx}
                isMobile={!!isMobile}
                expressionId={expressionId}
                audioIndex={idx}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
