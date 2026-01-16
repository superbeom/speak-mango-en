"use client";

import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { Volume2, Loader2, Square, Pause, Play } from "lucide-react";
import { trackAudioPlay, trackAudioComplete } from "@/analytics";
import { useIsMobile } from "@/hooks/useIsMobile";
import { AUDIO_PLAYBACK_START } from "@/constants/events";
import { cn, getStorageUrl } from "@/lib/utils";

// Extend Window interface for Webkit compatibility
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export interface DialogueAudioButtonHandle {
  play: (isSequential?: boolean) => Promise<void>;
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
  // Analytics props
  expressionId?: string;
  audioIndex?: number;
  playType?: "individual" | "sequential";
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
>(
  (
    {
      audioUrl,
      className,
      variant = "default",
      stopBehavior = "reset",
      onPlayAttempt,
      onEnded,
      onPlay,
      onStop,
      onReady,
      expressionId,
      audioIndex,
      playType = "individual",
    },
    ref
  ) => {
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

    // Latest Ref pattern to keep togglePlay stable and avoid stale closures
    const latestValues = useRef({
      isPlaying,
      isPaused,
      stopBehavior,
      onStop,
      onPlayAttempt,
      expressionId,
      audioIndex,
      playType,
      onPlay,
    });

    // Update the ref on every render with the latest state and props
    useEffect(() => {
      latestValues.current = {
        isPlaying,
        isPaused,
        stopBehavior,
        onStop,
        onPlayAttempt,
        expressionId,
        audioIndex,
        playType,
        onPlay,
      };
    }); // No dependency array: runs on every render

    // Web Audio API initialization function (Lazy Init)
    const initializeWebAudio = useCallback(() => {
      try {
        const AudioContextClass =
          window.AudioContext || window.webkitAudioContext;

        if (AudioContextClass && audioRef.current && !audioContextRef.current) {
          const ctx = new AudioContextClass();

          // Android: Try to resume immediately
          if (ctx.state === "suspended") {
            ctx.resume().catch(() => {
              // Silently fail on iOS, will be resumed on user gesture
            });
          }

          const gainNode = ctx.createGain();

          // Connect: Source -> Gain -> Destination
          const source = ctx.createMediaElementSource(audioRef.current);
          source.connect(gainNode);
          gainNode.connect(ctx.destination);

          audioContextRef.current = ctx;

          // Set fixed amplified volume
          gainNode.gain.value = FIXED_VOLUME;
        }
      } catch {
        // Web Audio API failed, fallback to basic HTML5 Audio
        if (audioRef.current) {
          audioRef.current.volume = 1.0;
        }
      }
    }, []);

    const togglePlay = useCallback(
      async (forcePlay = false, isSequential = false) => {
        if (!audioRef.current) return;

        const current = latestValues.current;

        // Initialize Web Audio API here (Lazy Initialization on Click)
        // This ensures we are within a User Gesture context for iOS In-App Browsers
        if (!audioContextRef.current) {
          initializeWebAudio();
        }

        // 만약 파일 로딩이 안된 상태라면 load() 강제 호출
        if (audioRef.current.readyState < 2) {
          audioRef.current.load();
        }

        // Resume AudioContext if suspended (browser policy)
        // iOS Safari requires this to be called within a user gesture
        if (audioContextRef.current?.state === "suspended") {
          try {
            await audioContextRef.current.resume();
          } catch (e) {
            console.warn("AudioContext resume failed:", e);
          }
        }

        if (current.isPlaying && !forcePlay) {
          audioRef.current.pause();
          if (current.stopBehavior === "reset") {
            audioRef.current.currentTime = 0; // Reset to start
            setIsPaused(false);
          } else {
            setIsPaused(true);
          }
          setIsPlaying(false);
          current.onStop?.();
        } else {
          // Check if this is a resume (from paused state)
          const isResume = current.isPaused;
          setIsPaused(false);

          // Feature Gating: Check permissions if callback provided
          if (current.onPlayAttempt) {
            const canPlay = await current.onPlayAttempt();
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

            // Skip tracking if:
            // 1. This is a forced play (from ref.play()) AND isSequential is true (auto-play sequence)
            // 2. This is a resume from paused state (not a new play)
            const shouldSkipTracking = (forcePlay && isSequential) || isResume;

            // Track audio play event (only if NOT part of auto-playing sequence and NOT a resume)
            // When auto-playing, DialogueSection already tracked the sequential play
            if (
              !shouldSkipTracking &&
              current.expressionId !== undefined &&
              current.audioIndex !== undefined
            ) {
              trackAudioPlay({
                expressionId: current.expressionId,
                audioIndex: current.audioIndex,
                playType: current.playType,
              });
            }

            current.onPlay?.();
          } catch (error) {
            console.error("Playback failed:", error);
            setIsPlaying(false);
          }
        }
      },
      [initializeWebAudio]
    );

    useImperativeHandle(
      ref,
      () => ({
        play: async (isSequential = false) => {
          await togglePlay(true, isSequential);
        },
        stop: () => {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
            setIsPaused(false);
          }
        },
      }),
      [togglePlay] // togglePlay가 stable해졌으므로 ref 객체도 안정적으로 유지됨
    );

    useEffect(() => {
      if (!audioUrl) return;

      // Initialize Audio Element
      const audio = new Audio(getStorageUrl(audioUrl) || "");
      audio.crossOrigin = "anonymous"; // Essential for Web Audio API with external sources
      audio.preload = "metadata";
      audioRef.current = audio;

      // Event handlers
      const handleEnded = () => {
        setIsPlaying(false);
        setIsPaused(false);

        // Track audio complete event
        const current = latestValues.current;
        if (
          current.expressionId !== undefined &&
          current.audioIndex !== undefined
        ) {
          trackAudioComplete({
            expressionId: current.expressionId,
            audioIndex: current.audioIndex,
          });
        }

        onEndedRef.current?.();
      };

      const handleCanPlayThrough = () => {
        setIsLoading(false);
        onReadyRef.current?.();
      };

      // iOS Safari fallback: loadeddata fires even when AudioContext is suspended
      const handleLoadedData = () => {
        setIsLoading(false);
        onReadyRef.current?.();
      };

      const handleLoadStart = () => {
        setIsLoading(true);
      };

      const handleError = (e: Event) => {
        setIsLoading(false);
        setIsPlaying(false);

        const audioEl = e.target as HTMLAudioElement;
        const error = audioEl.error;

        console.error("Audio playback error:", {
          code: error?.code,
          message: error?.message,
          src: audioEl.src,
          event: e,
        });

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
      audio.addEventListener("loadeddata", handleLoadedData); // iOS Safari fallback
      audio.addEventListener("loadstart", handleLoadStart);
      audio.addEventListener("error", handleError);

      window.addEventListener(AUDIO_PLAYBACK_START, handleGlobalStop);

      // Initialize loading immediately to prevent Safari Web Audio deadlock
      audio.load();

      return () => {
        audio.pause();
        audio.removeEventListener("ended", handleEnded);
        audio.removeEventListener("canplaythrough", handleCanPlayThrough);
        audio.removeEventListener("loadeddata", handleLoadedData);
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

    // Handle Media Session API
    useEffect(() => {
      // Only update Media Session if this component is playing
      // This allows the lock screen to control the currently active audio
      if (isPlaying && "mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: "Dialogue Audio",
          artist: "Speak Mango",
          artwork: [
            {
              src: "/assets/icon-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/assets/icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        });

        navigator.mediaSession.setActionHandler("play", () => {
          togglePlay(true);
        });
        navigator.mediaSession.setActionHandler("pause", () => {
          togglePlay();
        });
        navigator.mediaSession.setActionHandler("stop", () => {
          togglePlay();
        });
      }
    }, [isPlaying, togglePlay]);

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
  }
);

DialogueAudioButton.displayName = "DialogueAudioButton";

export default DialogueAudioButton;
