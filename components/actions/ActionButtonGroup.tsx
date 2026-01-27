"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ActionButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable wrapper for action button groups to prevent card interactions.
 * It isolates pointer events from parent containers like motion.div or Link.
 */
export default function ActionButtonGroup({
  children,
  className,
}: ActionButtonGroupProps) {
  const preventPropagation = (e: React.PointerEvent | React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      data-action-buttons
      className={cn("pointer-events-auto", className)}
      onPointerDown={preventPropagation}
      onPointerUp={preventPropagation}
      onClick={preventPropagation}
    >
      {children}
    </div>
  );
}
