"use client";

import { useI18n } from "@/shared/i18n/i18n-context";
import type { TaskImportanceDimensions } from "@/shared/model/entities";
import { taskImportance } from "@/shared/model/task-importance";
import { Field, Select } from "./ui";

const dimensions = ["impact", "goal", "risk", "value"] as const;

export function TaskImportanceFields({
  value,
  onChange,
}: {
  value: TaskImportanceDimensions;
  onChange: (value: TaskImportanceDimensions) => void;
}) {
  const { t } = useI18n();
  return (
    <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{t("me.importanceDimensions")}</h3>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold dark:bg-zinc-900">
          {t("me.importance")}: {taskImportance(value)} / 20
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {dimensions.map((dimension) => (
          <Field
            key={dimension}
            label={t(`me.${dimension}`)}
            hint={t(`me.${dimension}Hint`)}
          >
            <Select
              value={value[dimension]}
              onChange={(event) =>
                onChange({ ...value, [dimension]: Number(event.target.value) })
              }
            >
              {([1, 2, 3, 4, 5] as const).map((score) => (
                <option key={score} value={score}>
                  {score} · {t(`me.${dimension}.${score}`)}
                </option>
              ))}
            </Select>
          </Field>
        ))}
      </div>
    </section>
  );
}
