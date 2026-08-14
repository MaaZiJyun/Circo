"use client";

import type { CSSProperties } from "react";

const colors = [
  "#f43f5e",
  "#f59e0b",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

export function SummaryCelebration() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[70] overflow-hidden"
    >
      {Array.from({ length: 56 }, (_, index) => {
        const style = {
          "--celebration-x": `${(index * 37) % 100}vw`,
          "--celebration-drift": `${((index * 29) % 31) - 15}vw`,
          "--celebration-delay": `${(index % 12) * 45}ms`,
          "--celebration-duration": `${1800 + (index % 7) * 130}ms`,
          "--celebration-rotation": `${360 + (index % 5) * 180}deg`,
          backgroundColor: colors[index % colors.length],
          borderRadius: index % 3 === 0 ? "999px" : "2px",
        } as CSSProperties;
        return (
          <span
            key={index}
            className="summary-celebration-piece absolute -top-6 h-3 w-2 opacity-0"
            style={style}
          />
        );
      })}
      <div className="summary-celebration-glow absolute left-1/2 top-1/3 size-72 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-300/25 via-pink-400/25 to-violet-400/25 opacity-0 blur-3xl" />
    </div>
  );
}
