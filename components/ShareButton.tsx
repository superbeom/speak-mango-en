"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { trackShareClick, trackShareComplete } from "@/analytics";
import { ToastType, TOAST_TYPE } from "@/types/toast";
import { cn } from "@/lib/utils";
import { getShareUrl } from "@/lib/utils";
import Toast from "@/components/ui/Toast";

interface ShareButtonProps {
  expressionId: string;
  expressionText: string;
  meaning: string;
  shareLabel: string;
  shareCopiedLabel: string;
  shareFailedLabel: string;
  variant?: "default" | "compact";
  onClick?: (e: React.MouseEvent) => void;
}

export default function ShareButton({
  expressionId,
  expressionText,
  meaning,
  shareLabel,
  shareCopiedLabel,
  shareFailedLabel,
  variant = "default",
  onClick,
}: ShareButtonProps) {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>(TOAST_TYPE.SUCCESS);

  const handleShare = async (e: React.MouseEvent) => {
    // Prevent event propagation and default behavior (for card integration)
    e.preventDefault();
    e.stopPropagation();

    if (onClick) {
      onClick(e);
    }

    const shareUrl = getShareUrl(expressionId, {
      utm_source: "share",
      utm_medium: "native",
    });

    const shareData = {
      title: expressionText,
      text: `${expressionText} - ${meaning}`,
      url: shareUrl,
    };

    // Check if Web Share API is supported
    if (navigator.share) {
      try {
        // Track share click with native method
        trackShareClick({
          expressionId,
          shareMethod: "native",
          sharePlatform: "native",
        });

        await navigator.share(shareData);

        // Track successful share
        trackShareComplete({
          expressionId,
          sharePlatform: "native",
        });

        // Show success toast
        setToastMessage(shareCopiedLabel);
        setToastType(TOAST_TYPE.SUCCESS);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 1500);
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== "AbortError") {
          setToastMessage(shareFailedLabel);
          setToastType(TOAST_TYPE.ERROR);
          setShowToast(true);
          setTimeout(() => setShowToast(false), 1500);
        }
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        // Track share click with copy_link method
        trackShareClick({
          expressionId,
          shareMethod: "copy_link",
          sharePlatform: "clipboard",
        });

        await navigator.clipboard.writeText(shareUrl);

        // Track successful copy
        trackShareComplete({
          expressionId,
          sharePlatform: "clipboard",
        });

        // Show success toast
        setToastMessage(shareCopiedLabel);
        setToastType(TOAST_TYPE.SUCCESS);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 1500);
      } catch (error) {
        setToastMessage(shareFailedLabel);
        setToastType(TOAST_TYPE.ERROR);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 1500);
      }
    }
  };

  return (
    <>
      <button
        onClick={handleShare}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl font-medium text-sm",
          "transition-all duration-200 ease-out",
          "cursor-pointer",
          variant === "compact"
            ? [
                "w-9 h-9 p-2 justify-center",
                "bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm",
                "text-zinc-700 dark:text-zinc-300",
                "hover:bg-white dark:hover:bg-zinc-800",
                "active:scale-95",
                "shadow-sm hover:shadow-md",
              ]
            : [
                "px-4 py-2.5",
                "blue-btn",
                "active:scale-95",
                "shadow-sm hover:shadow-md",
              ],
        )}
        aria-label={shareLabel}
      >
        <Share2 className={variant === "compact" ? "w-4 h-4" : "w-4 h-4"} />
        {variant === "default" && <span>{shareLabel}</span>}
      </button>

      <Toast message={toastMessage} type={toastType} isVisible={showToast} />
    </>
  );
}
