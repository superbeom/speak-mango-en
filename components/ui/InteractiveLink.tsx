"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Any type used here to avoid version-specific type name conflicts for AnimationControls
interface SimpleAnimationControls {
  start: (definition: {
    scale?: number;
    transition?: { duration?: number };
  }) => Promise<void>;
}

export default function InteractiveLink({
  href,
  children,
  isStatic,
  enableHover,
  controls,
  onClick,
  className,
}: {
  href: string;
  children: React.ReactNode;
  isStatic: boolean;
  enableHover: boolean;
  controls: SimpleAnimationControls;
  onClick: () => void;
  className?: string;
}) {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const safeStart = (
    definition: Parameters<SimpleAnimationControls["start"]>[0],
  ) => {
    if (isMounted.current) {
      controls.start(definition);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isStatic) return;

    // Prevent animation if clicking on action buttons
    const target = e.target as HTMLElement;
    if (target.closest("[data-action-buttons]")) {
      return;
    }

    if (enableHover) {
      safeStart({ scale: 0.98, transition: { duration: 0.1 } });
    }
  };

  const handlePointerUp = () => {
    if (isStatic) return;
    safeStart({ scale: 1, transition: { duration: 0.1 } });
  };

  const handlePointerLeave = () => {
    if (isStatic) return;
    safeStart({ scale: 1, transition: { duration: 0.1 } });
  };

  const handleClick = (e: React.MouseEvent) => {
    // Check if clicking on action buttons - if so, prevent navigation
    const target = e.target as HTMLElement;
    if (target.closest("[data-action-buttons]")) {
      e.preventDefault();
      return;
    }
    onClick();
  };

  return (
    <Link
      href={href}
      className={cn("relative block h-full rounded-card", className)}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
