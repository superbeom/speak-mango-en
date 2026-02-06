"use client";

import { ActionIconSize } from "@/constants/ui";
import { cn } from "@/lib/utils";
import ActionButtonGroup from "@/components/actions/ActionButtonGroup";
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
  hideSaveButton?: boolean;
}

export default function ExpressionActions({
  expressionId,
  expressionText,
  meaning,
  className,
  actionButtonSize,
  shareVariant = "default",
  onShareClick,
  hideSaveButton = false,
}: ExpressionActionsProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between relative z-10 pointer-events-none",
        className,
      )}
    >
      <ActionButtonGroup>
        {!hideSaveButton && (
          <SaveButton expressionId={expressionId} size={actionButtonSize} />
        )}
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
