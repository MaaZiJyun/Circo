"use client";

import { useState } from "react";
import { activeItems } from "@/shared/model/app-state";
import { taskBlocking, taskDueRange } from "@/shared/model/task-urgency";
import { useStore } from "@/shared/view-models/store-context";
import { useI18n } from "@/shared/i18n/i18n-context";
import { Button, Field, Select } from "./ui";

const delayLossLabels = [
  "",
  "No impact",
  "Small time loss",
  "Affects some work",
  "Blocks other tasks",
  "Major loss",
];

export function TaskUrgencyFields({
  taskId = "new-task",
  deadline,
  delayLoss,
  dependencyIds,
  onChange,
}: {
  taskId?: string;
  deadline: string;
  delayLoss: number;
  dependencyIds: string[];
  onChange: (value: { delayLoss: number; dependencyIds: string[] }) => void;
}) {
  const { state } = useStore();
  const { t } = useI18n();
  const [choosingDependencies, setChoosingDependencies] = useState(false);
  const [draftDependencyIds, setDraftDependencyIds] = useState(dependencyIds);
  const tasks = activeItems(state?.tasks ?? []);
  const options = tasks.filter((task) => task.id !== taskId);
  const dueRange = taskDueRange(deadline);
  const blocking = taskBlocking(taskId, tasks);
  return (
    <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{t("me.urgencyScore")}</h3>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold dark:bg-zinc-900">
          {t("me.urgency")}: {dueRange + delayLoss + blocking} / 15
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Delay Loss" hint={t("me.delayLossHint")}>
          <Select
            value={delayLoss}
            onChange={(event) =>
              onChange({ delayLoss: Number(event.target.value), dependencyIds })
            }
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {value} — {delayLossLabels[value]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Dependencies" hint={t("me.dependenciesHint")}>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => {
              setDraftDependencyIds(dependencyIds);
              setChoosingDependencies(true);
            }}
          >
            {t("me.chooseDependencies")} · {dependencyIds.length}
          </Button>
        </Field>
      </div>
      {choosingDependencies && (
        <div className="mt-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
          <div className="grid max-h-40 gap-2 overflow-y-auto">
            {!options.length && (
              <span className="text-xs text-zinc-500">
                {t("me.noDependencyOptions")}
              </span>
            )}
            {options.map((task) => (
              <label key={task.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draftDependencyIds.includes(task.id)}
                  onChange={() =>
                    setDraftDependencyIds((current) =>
                      current.includes(task.id)
                        ? current.filter((id) => id !== task.id)
                        : [...current, task.id],
                    )
                  }
                />
                <span className="truncate">{task.title}</span>
              </label>
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              onClick={() => {
                onChange({ delayLoss, dependencyIds: draftDependencyIds });
                setChoosingDependencies(false);
              }}
            >
              {t("me.confirmDependencies")}
            </Button>
          </div>
        </div>
      )}
      <p className="mt-3 text-xs text-zinc-500">
        Deadline {dueRange} + Delay Loss {delayLoss} + Blocking {blocking}.
      </p>
    </section>
  );
}
