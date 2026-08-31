"use client";

import { useRef } from "react";

export interface PressPosition {
  x: number;
  y: number;
}

/**
 * Shared long-press gesture: after `delay` ms of holding the primary pointer
 * button over an item, `onLongPress` fires with the item and pointer position.
 * `consumePress` tells a click handler to swallow the synthetic click that
 * follows a long-press.
 */
export function useLongPress<T>(
  onLongPress: (item: T, position: PressPosition) => void,
  delay = 550,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressedRef = useRef<T | null>(null);

  const cancel = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const onPointerDown = (event: React.PointerEvent, item: T) => {
    if (event.button !== 0) return;
    cancel();
    const position = { x: event.clientX, y: event.clientY };
    timerRef.current = setTimeout(() => {
      pressedRef.current = item;
      onLongPress(item, position);
    }, delay);
  };

  const consumePress = (item: T) => {
    if (pressedRef.current === item) {
      pressedRef.current = null;
      return true;
    }
    return false;
  };

  return {
    onPointerDown,
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onPointerMove: cancel,
    cancel,
    consumePress,
  };
}
