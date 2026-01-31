import { useRef } from "react";

/**
 * Hook to handle long press gestures.
 */
export function useLongPress(
  onLongPress: () => void,
  onClick?: () => void,
  delay = 600,
) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressActive = useRef(false);

  const start = () => {
    isLongPressActive.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressActive.current = true;
      onLongPress();
    }, delay);
  };

  const clear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const handleEvent = (e: React.MouseEvent | React.TouchEvent) => {
    if (isLongPressActive.current) {
      e.preventDefault();
      return;
    }
    if (onClick) onClick();
  };

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    onClick: handleEvent,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };
}
