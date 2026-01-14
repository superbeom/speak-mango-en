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
}

export default function ShareButton({
  expressionId,
  expressionText,
  meaning,
  shareLabel,
  shareCopiedLabel,
  shareFailedLabel,
}: ShareButtonProps) {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>(TOAST_TYPE.SUCCESS);

  const handleShare = async () => {
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
          "inline-flex items-center gap-2 rounded-xl px-4 py-2.5",
          "bg-blue-500 text-white font-medium text-sm",
          "hover:bg-blue-600 active:scale-95",
          "transition-all duration-200 ease-out",
          "shadow-sm hover:shadow-md",
          "cursor-pointer"
        )}
        aria-label={shareLabel}
      >
        <Share2 className="w-4 h-4" />
        <span>{shareLabel}</span>
      </button>

      <Toast message={toastMessage} type={toastType} isVisible={showToast} />
    </>
  );
}
