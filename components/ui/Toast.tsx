"use client";

import { Check, X } from "lucide-react";
import { ToastType, TOAST_TYPE } from "@/types/toast";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
}

export default function Toast({ message, type, isVisible }: ToastProps) {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-8 left-1/2 -translate-x-1/2 z-50",
        "px-6 py-3 rounded-xl shadow-lg",
        "flex items-center gap-2",
        "animate-in fade-in slide-in-from-bottom-2 duration-300",
        type === TOAST_TYPE.SUCCESS
          ? "bg-green-500 text-white"
          : "bg-red-500 text-white"
      )}
    >
      {type === TOAST_TYPE.SUCCESS && <Check className="w-4 h-4" />}
      {type === TOAST_TYPE.ERROR && <X className="w-4 h-4" />}
      <span className="font-medium text-sm">{message}</span>
    </div>
  );
}
