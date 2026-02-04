"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useI18n } from "@/context/I18nContext";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: "default" | "destructive";
}

export default function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  variant = "destructive",
}: ConfirmDialogProps) {
  const { dict } = useI18n();

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {isOpen && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-48%" }}
                animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-48%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-[380px] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xl"
              >
                <div className="flex flex-col gap-6">
                  {/* Header: Icon + Title */}
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "p-2.5 rounded-xl shrink-0",
                        variant === "destructive"
                          ? "bg-red-50 dark:bg-red-500/10 text-red-500"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500",
                      )}
                    >
                      <AlertTriangle size={24} />
                    </div>
                    <DialogPrimitive.Title className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                      {title}
                    </DialogPrimitive.Title>
                  </div>

                  <DialogPrimitive.Description className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {description}
                  </DialogPrimitive.Description>

                  <div className="flex items-center gap-3 w-full mt-2">
                    <button
                      onClick={() => onOpenChange(false)}
                      className="flex-1 px-4 py-3 text-sm font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-zinc-400"
                    >
                      {cancelLabel || dict.common.cancel}
                    </button>
                    <button
                      onClick={() => {
                        onConfirm();
                        onOpenChange(false);
                      }}
                      className={cn(
                        "flex-1 px-4 py-3 text-sm font-bold text-white rounded-xl transition-all cursor-pointer outline-hidden focus-visible:ring-2 active:scale-[0.98]",
                        variant === "destructive"
                          ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 focus-visible:ring-red-400"
                          : "bg-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 hover:opacity-90 focus-visible:ring-zinc-400",
                      )}
                    >
                      {confirmLabel || dict.vocabulary.delete}
                    </button>
                  </div>
                </div>

                <DialogPrimitive.Close className="absolute right-4 top-4 p-2 opacity-50 hover:opacity-100 transition-opacity rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 outline-hidden sm:cursor-pointer">
                  <X className="h-4 w-4" />
                  <span className="sr-only">{dict.common.close}</span>
                </DialogPrimitive.Close>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
