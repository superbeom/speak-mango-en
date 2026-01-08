"use client";

import { useState, useRef, useEffect } from "react";
import { Volume2, Loader2, Pause } from "lucide-react";
import { AUDIO_PLAYBACK_START } from "@/constants/events";
import { cn } from "@/lib/utils";

interface DialogueAudioButtonProps {
  audioUrl?: string;
  className?: string;
  /**
   * Callback triggered when a user attempts to play audio.
   * Return true to allow playback, false to prevent it (e.g., for tier checks).
   */
  onPlayAttempt?: () => boolean | Promise<boolean>;
}

export default function DialogueAudioButton({
  audioUrl,
  className,
  onPlayAttempt,
}: DialogueAudioButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const handleEnded = () => setIsPlaying(false);
    const handleCanPlayThrough = () => setIsLoading(false);
    const handleLoadStart = () => setIsLoading(true);
    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      console.error("Audio playback error");
    };

    // Listen for custom event to stop other audios
    const handleGlobalStop = (e: Event) => {
      const customEvent = e as CustomEvent<{ audio: HTMLAudioElement }>;
      if (customEvent.detail.audio !== audio) {
        audio.pause();
        audio.currentTime = 0; // Optional: Reset to start
        setIsPlaying(false);
      }
    };

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("canplaythrough", handleCanPlayThrough);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("error", handleError);

    window.addEventListener(AUDIO_PLAYBACK_START, handleGlobalStop);

    return () => {
      audio.pause();
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("canplaythrough", handleCanPlayThrough);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("error", handleError);
      window.removeEventListener(AUDIO_PLAYBACK_START, handleGlobalStop);
      audioRef.current = null;
    };
  }, [audioUrl]);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Feature Gating: Check permissions if callback provided
      if (onPlayAttempt) {
        const canPlay = await onPlayAttempt();
        if (!canPlay) return;
      }

      // Dispatch custom event BEFORE playing to stop others first
      window.dispatchEvent(
        new CustomEvent(AUDIO_PLAYBACK_START, {
          detail: { audio: audioRef.current },
        })
      );

      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((error) => {
            console.error("Playback failed:", error);
            setIsPlaying(false);
          });
      }
    }
  };

  if (!audioUrl) return null;

  return (
    <button
      onClick={togglePlay}
      className={cn(
        "p-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer",
        isPlaying
          ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          : "hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-300",
        className
      )}
      disabled={isLoading}
      aria-label={isPlaying ? "Pause audio" : "Play audio"}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isPlaying ? (
        <Pause className="w-4 h-4 fill-current" />
      ) : (
        <Volume2 className="w-4 h-4" />
      )}
    </button>
  );
}
