"use client";

import React from "react";
import Link from "next/link";

// Any type used here to avoid version-specific type name conflicts for AnimationControls
export default function InteractiveLink({
  href,
  children,
  isStatic,
  enableHover,
  controls,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  isStatic: boolean;
  enableHover: boolean;
  controls: any;
  onClick: () => void;
}) {
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isStatic) return;

    // Prevent animation if clicking on action buttons
    const target = e.target as HTMLElement;
    if (target.closest("[data-action-buttons]")) {
      return;
    }

    if (enableHover) {
      controls.start({ scale: 0.98, transition: { duration: 0.1 } });
    }
  };

  const handlePointerUp = () => {
    if (isStatic) return;
    controls.start({ scale: 1, transition: { duration: 0.1 } });
  };

  const handlePointerLeave = () => {
    if (isStatic) return;
    controls.start({ scale: 1, transition: { duration: 0.1 } });
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
      className="relative block h-full rounded-card"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
