"use client";

import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Volume2, Loader2, Square, Pause, Play } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { AUDIO_PLAYBACK_START } from "@/constants/events";
import { cn } from "@/lib/utils";

// Extend Window interface for Webkit compatibility
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export interface DialogueAudioButtonHandle {
  play: () => Promise<void>;
  stop: () => void;
}

interface DialogueAudioButtonProps {
  audioUrl?: string;
  className?: string;
  variant?: "default" | "blue";
  stopBehavior?: "reset" | "pause";
  /**
   * Callback triggered when a user attempts to play audio.
   * Return true to allow playback, false to prevent it (e.g., for tier checks).
   */
  onPlayAttempt?: () => boolean | Promise<boolean>;
  onEnded?: () => void;
  onPlay?: () => void;
  onStop?: () => void;
  onReady?: () => void;
}

const FIXED_VOLUME = 2.0;

interface DialogueAudioIconProps {
  isLoading: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  stopBehavior: "reset" | "pause";
}

const DialogueAudioIcon = ({
  isLoading,
  isPlaying,
  isPaused,
  stopBehavior,
}: DialogueAudioIconProps) => {
  if (isLoading) return <Loader2 className="w-4 h-4 animate-spin" />;

  if (isPlaying) {
    if (stopBehavior === "pause") {
      return <Pause className="w-4 h-4 fill-current" />;
    }
    return (
      <span className="w-4 h-4 flex items-center justify-center">
        <Square className="w-3 h-3 fill-current" />
      </span>
    );
  }

  if (isPaused) return <Play className="w-4 h-4 fill-current" />;

  return <Volume2 className="w-4 h-4" />;
};

const DialogueAudioButton = forwardRef<
  DialogueAudioButtonHandle,
  DialogueAudioButtonProps
>(({ audioUrl, className, variant = "default", stopBehavior = "reset", onPlayAttempt, onEnded, onPlay, onStop, onReady }, ref) => {
  const isMobile = useIsMobile();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Web Audio API refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const onEndedRef = useRef(onEnded);
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    onEndedRef.current = onEnded;
    onReadyRef.current = onReady;
  }, [onEnded, onReady]);

  const togglePlay = async (forcePlay = false) => {
    if (!audioRef.current) return;

    // Resume AudioContext if suspended (browser policy)
    if (audioContextRef.current?.state === "suspended") {
      await audioContextRef.current.resume();
    }

    if (isPlaying && !forcePlay) {
      audioRef.current.pause();
      if (stopBehavior === "reset") {
        audioRef.current.currentTime = 0; // Reset to start
        setIsPaused(false);
      } else {
        setIsPaused(true);
      }
      setIsPlaying(false);
      onStop?.();
    } else {
      setIsPaused(false);
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

      try {
        await audioRef.current.play();
        setIsPlaying(true);
        onPlay?.();
      } catch (error) {
        console.error("Playback failed:", error);
        setIsPlaying(false);
      }
    }
  };

  useImperativeHandle(ref, () => ({
    play: async () => {
      await togglePlay(true);
    },
    stop: () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
        setIsPaused(false);
      }
    },
  }));

  useEffect(() => {
    if (!audioUrl) return;

    // Initialize Audio Element
    const audio = new Audio();
    audio.crossOrigin = "anonymous"; // Essential for Web Audio API with external sources
    audio.src = audioUrl;
    audioRef.current = audio;

    // Initialize Web Audio API
    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const gainNode = ctx.createGain();

        // Connect: Source -> Gain -> Destination
        const source = ctx.createMediaElementSource(audio);
        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        audioContextRef.current = ctx;

        // Set fixed amplified volume
        gainNode.gain.value = FIXED_VOLUME;
      }
    } catch (e) {
      console.warn(
        "Web Audio API not supported or CORS failed, falling back to basic audio.",
        e
      );
      // Fallback volume is clamped to 1.0
      audio.volume = Math.min(Math.max(FIXED_VOLUME, 0), 1);
    }

    const handleEnded = () => {
      setIsPlaying(false);
      setIsPaused(false);
      onEndedRef.current?.();
    };
    const handleCanPlayThrough = () => {
      setIsLoading(false);
      onReadyRef.current?.();
    };
    const handleLoadStart = () => setIsLoading(true);
    const handleError = (e: Event) => {
      setIsLoading(false);
      setIsPlaying(false);
      console.error("Audio playback error", e);
      onReadyRef.current?.();
    };

    // Listen for custom event to stop other audios
    const handleGlobalStop = (e: Event) => {
      const customEvent = e as CustomEvent<{ audio: HTMLAudioElement }>;
      if (customEvent.detail.audio !== audio) {
        audio.pause();
        audio.currentTime = 0; // Reset to start
        setIsPlaying(false);
        setIsPaused(false);
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

      // Cleanup Web Audio API
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      audioRef.current = null;
      audioContextRef.current = null;
    };
  }, [audioUrl]);

  if (!audioUrl) return null;

  return (
    <button
      onClick={() => togglePlay()}
      className={cn(
        "dialogue-audio-btn",
        // Variant: Default (User A - Gray bubble)
        variant === "default" && [
          isPlaying
            ? cn(
              "bg-zinc-200/60 text-zinc-400 dark:bg-zinc-700 dark:text-zinc-400",
              !isMobile && "hover:text-zinc-600 dark:hover:text-zinc-100"
            )
            : cn(
              "text-zinc-400 dark:text-zinc-500",
              !isMobile &&
              "hover:bg-zinc-200/60 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
            ),
        ],
        // Variant: Blue (User B - Blue bubble)
        variant === "blue" && [
          isPlaying
            ? "bg-blue-500 text-white" // Playing style = Hover style
            : cn(
              "text-blue-200",
              !isMobile && "hover:bg-blue-500 hover:text-white"
            ),
        ],
        isLoading && "cursor-not-allowed opacity-70",
        className
      )}
      disabled={isLoading}
      aria-label={isPlaying ? "Stop audio" : "Play audio"}
    >
      <DialogueAudioIcon
        isLoading={isLoading}
        isPlaying={isPlaying}
        isPaused={isPaused}
        stopBehavior={stopBehavior}
      />
    </button>
  );
});

DialogueAudioButton.displayName = "DialogueAudioButton";

export default DialogueAudioButton;
