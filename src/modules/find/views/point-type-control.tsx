"use client";

import { useI18n } from "@/shared/i18n/i18n-context";

export function PointTypeControl({
  value,
  onChange,
}: {
  value: "text" | "image";
  onChange: (value: "text" | "image") => void;
}) {
  const { t } = useI18n();
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {t("find.pointType")}
      </legend>
      <div className="grid w-full grid-cols-2 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        {(["text", "image"] as const).map((type) => (
          <button
            key={type}
            type="button"
            aria-pressed={value === type}
            className={`min-h-11 px-3 text-sm font-medium transition-colors first:border-r first:border-zinc-200 dark:first:border-zinc-800 ${
              value === type
                ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950"
                : "bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900"
            }`}
            onClick={() => onChange(type)}
          >
            {t(`find.pointType.${type}`)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
