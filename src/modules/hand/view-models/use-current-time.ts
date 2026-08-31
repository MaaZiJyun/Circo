"use client";

import { useEffect, useState } from "react";

export function useCurrentTime(refreshInterval = 30_000) {
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const refresh = () => {
    const value = Date.now();
    setCurrentTime(value);
    return value;
  };
  useEffect(() => {
    const update = () => setCurrentTime(Date.now());
    update();
    const timer = window.setInterval(update, refreshInterval);
    return () => window.clearInterval(timer);
  }, [refreshInterval]);
  return { currentTime, refresh };
}
