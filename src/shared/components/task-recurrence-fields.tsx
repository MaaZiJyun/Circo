"use client";

import { Field, Input, Select } from "./ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { TaskRecurrence } from "@/shared/model/entities";

export function TaskRecurrenceFields({
  value,
  onChange,
}: {
  value: TaskRecurrence | null;
  onChange: (value: TaskRecurrence | null) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label={t("task.recurrence")}>
        <Select
          value={value?.unit ?? "none"}
          onChange={(event) =>
            onChange(
              event.target.value === "none"
                ? null
                : {
                    interval: value?.interval ?? 1,
                    unit: event.target.value as TaskRecurrence["unit"],
                  },
            )
          }
        >
          <option value="none">{t("task.recurrence.none")}</option>
          <option value="day">{t("task.recurrence.day")}</option>
          <option value="week">{t("task.recurrence.week")}</option>
          <option value="month">{t("task.recurrence.month")}</option>
          <option value="year">{t("task.recurrence.year")}</option>
        </Select>
      </Field>
      <Field label={t("task.recurrence.interval")}>
        <Input
          type="number"
          min="1"
          max="999"
          disabled={!value}
          value={value?.interval ?? 1}
          onChange={(event) =>
            value &&
            onChange({
              ...value,
              interval: Math.max(1, Number(event.target.value)),
            })
          }
        />
      </Field>
    </div>
  );
}
