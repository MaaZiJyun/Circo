"use client";

import { taskEffort } from "@/shared/model/task-effort";
import { useI18n } from "@/shared/i18n/i18n-context";
import { Field, Select } from "./ui";

export function TaskEffortFields({
  estimatedMinutes,
  complexity,
  uncertainty,
  onChange,
}: {
  estimatedMinutes: number;
  complexity: number;
  uncertainty: number;
  onChange: (value: { complexity: number; uncertainty: number }) => void;
}) {
  const { t } = useI18n();
  const result = taskEffort({ estimatedMinutes, complexity, uncertainty });
  const select = (key: "complexity" | "uncertainty", value: number) => (
    <Field label={t(`me.${key}`)} hint={t(`me.${key}Hint`)}>
      <Select
        value={value}
        onChange={(event) =>
          onChange({
            complexity,
            uncertainty,
            [key]: Number(event.target.value),
          })
        }
      >
        {([1, 2, 3, 4, 5] as const).map((item) => (
          <option key={item} value={item}>
            {item} — {t(`me.${key}.${item}`)}
          </option>
        ))}
      </Select>
    </Field>
  );
  return (
    <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{t("me.effortScore")}</h3>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold dark:bg-zinc-900">
          {t("me.effort")}: {result.effort} / 125
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {select("complexity", complexity)}
        {select("uncertainty", uncertainty)}
      </div>
    </section>
  );
}
