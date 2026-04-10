"use client";

import { useCallback, useRef, type TouchEvent } from "react";

type SwipeDirection = "left" | "right";

export function useSwipeNavigation(
  onSwipe: (direction: SwipeDirection) => void,
  threshold = 50
) {
  const startX = useRef(0);
  const startY = useRef(0);

  const onTouchStart = useCallback((e: TouchEvent) => {
    startX.current = e.touches[0]?.clientX ?? 0;
    startY.current = e.touches[0]?.clientY ?? 0;
  }, []);

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      const deltaX = (e.changedTouches[0]?.clientX ?? 0) - startX.current;
      const deltaY = (e.changedTouches[0]?.clientY ?? 0) - startY.current;

      if (
        Math.abs(deltaX) > threshold &&
        Math.abs(deltaX) > Math.abs(deltaY) * 1.5
      ) {
        onSwipe(deltaX > 0 ? "right" : "left");
      }
    },
    [onSwipe, threshold]
  );

  return { onTouchStart, onTouchEnd };
}
