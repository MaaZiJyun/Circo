"use client";

import { useI18n } from "@/shared/i18n/i18n-context";

export type FindMode = "library" | "reference";

export function FindModeSwitch({
  mode,
  onChange,
}: {
  mode: FindMode;
  onChange: (mode: FindMode) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="grid grid-cols-2 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900">
      {(["library", "reference"] as const).map((item) => (
        <button
          key={item}
          onClick={() => onChange(item)}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${mode === item ? "bg-white shadow-sm dark:bg-zinc-800" : "text-zinc-500"}`}
        >
          {t(item === "library" ? "find.library" : "find.reference")}
        </button>
      ))}
    </div>
  );
}
