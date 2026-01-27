"use client";

import { ActionIconSize } from "@/constants/ui";
import { cn } from "@/lib/utils";
import ActionButtonGroup from "@/components/actions/ActionButtonGroup";
import LikeButton from "@/components/actions/LikeButton";
import SaveButton from "@/components/actions/SaveButton";
import ShareButton from "@/components/actions/ShareButton";

interface ExpressionActionsProps {
  expressionId: string;
  expressionText: string;
  meaning: string;
  className?: string;
  actionButtonSize?: ActionIconSize;
  shareVariant?: "default" | "compact";
  onShareClick?: (e: React.MouseEvent) => void;
}

export default function ExpressionActions({
  expressionId,
  expressionText,
  meaning,
  className,
  actionButtonSize,
  shareVariant = "default",
  onShareClick,
}: ExpressionActionsProps) {
  // Determine gap based on size if not explicitly handled via className?
  // Actually, we group like/save together.
  const gapClass = actionButtonSize === "lg" ? "gap-4" : "gap-2";

  return (
    <div
      className={cn(
        "flex items-center justify-between relative z-10 pointer-events-none",
        className,
      )}
    >
      <ActionButtonGroup className={cn("flex", gapClass)}>
        <LikeButton expressionId={expressionId} size={actionButtonSize} />
        <SaveButton expressionId={expressionId} size={actionButtonSize} />
      </ActionButtonGroup>

      <ActionButtonGroup>
        <ShareButton
          variant={shareVariant}
          expressionId={expressionId}
          expressionText={expressionText}
          meaning={meaning}
          onClick={onShareClick}
        />
      </ActionButtonGroup>
    </div>
  );
}
