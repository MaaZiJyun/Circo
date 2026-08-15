"use client";

export const colorPalette = [
  ["#fecaca", "#f87171", "#b91c1c"],
  ["#fed7aa", "#fb923c", "#c2410c"],
  ["#fef08a", "#facc15", "#a16207"],
  ["#bbf7d0", "#4ade80", "#15803d"],
  ["#a5f3fc", "#22d3ee", "#0e7490"],
  ["#bfdbfe", "#60a5fa", "#1d4ed8"],
  ["#ddd6fe", "#a78bfa", "#6d28d9"],
] as const;

export function ColorPalette({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="grid grid-flow-col grid-cols-7 grid-rows-3 gap-2" role="radiogroup">
      {colorPalette.map((column) =>
        column.map((color) => (
          <button
            key={color}
            type="button"
            role="radio"
            aria-label={color}
            aria-checked={value.toLowerCase() === color}
            className={`size-8 rounded-full border-2 transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 ${value.toLowerCase() === color ? "border-zinc-950 ring-2 ring-zinc-400 ring-offset-2 dark:border-white dark:ring-zinc-500 dark:ring-offset-zinc-950" : "border-transparent"}`}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
          />
        )),
      )}
    </div>
  );
}
