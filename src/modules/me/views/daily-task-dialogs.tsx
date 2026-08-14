"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Dialog,
  EmptyState,
  Field,
  Input,
} from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import { TaskRecurrenceFields } from "@/shared/components/task-recurrence-fields";
import { TaskImportanceFields } from "@/shared/components/task-importance-fields";
import { TaskUrgencyFields } from "@/shared/components/task-urgency-fields";
import { TaskEffortFields } from "@/shared/components/task-effort-fields";
import type { TaskRecord } from "@/shared/model/entities";
import { addDays, today } from "@/shared/model/factories";
import { defaultTaskImportance, taskImportance } from "@/shared/model/task-importance";
import { defaultTaskUrgency } from "@/shared/model/task-urgency";
import { defaultTaskEffort } from "@/shared/model/task-effort";
import type { DailyTaskInput } from "../model/daily-task-input";

export function CreateDailyTaskDialog({
  open,
  onClose,
  onSave,
  title,
  plannedDate,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (input: DailyTaskInput) => void;
  title?: string;
  plannedDate?: string;
  initial?: DailyTaskInput;
}) {
  const { t } = useI18n();
  const [input, setInput] = useState<DailyTaskInput>(
    initial ?? {
      title: "",
      description: "",
      dueAt: `${plannedDate ?? addDays(new Date(), 1)}T23:59`,
      estimatedMinutes: 30,
      expectedOutput: "",
      ...defaultTaskImportance,
      importance: taskImportance(defaultTaskImportance),
      ...defaultTaskUrgency,
      ...defaultTaskEffort,
      milestone: false,
      recurrence: null,
    },
  );
  return (
    <Dialog
      open={open}
      title={title ?? t("me.dailyCreate")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <div className="grid gap-4">
        <Field label={t("me.dailyTaskName")}>
          <Input
            autoFocus
            value={input.title}
            onChange={(event) =>
              setInput({ ...input, title: event.target.value })
            }
          />
        </Field>
        <Field label={t("me.taskDescription")}>
          <Input
            value={input.description}
            onChange={(event) =>
              setInput({ ...input, description: event.target.value })
            }
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("me.taskDueAt")}>
            <Input
              type="datetime-local"
              min={`${plannedDate ?? today()}T00:00`}
              max={plannedDate ? `${plannedDate}T23:59` : undefined}
              value={input.dueAt}
              onChange={(event) =>
                setInput({ ...input, dueAt: event.target.value })
              }
            />
          </Field>
          <Field label={t("me.taskEstimate")}>
            <Input
              type="number"
              min="1"
              value={input.estimatedMinutes}
              onChange={(event) =>
                setInput({
                  ...input,
                  estimatedMinutes: Number(event.target.value),
                })
              }
            />
          </Field>
        </div>
        <Field label={t("me.taskExpectedOutput")}>
          <Input
            value={input.expectedOutput}
            onChange={(event) =>
              setInput({ ...input, expectedOutput: event.target.value })
            }
          />
        </Field>
        <TaskImportanceFields
          value={input}
          onChange={(dimensions) =>
            setInput({
              ...input,
              ...dimensions,
              importance: taskImportance(dimensions),
            })
          }
        />
        <TaskUrgencyFields deadline={input.dueAt} delayLoss={input.delayLoss}
          dependencyIds={input.dependencyIds} onChange={(urgency) => setInput({ ...input, ...urgency })} />
        <TaskEffortFields estimatedMinutes={input.estimatedMinutes} complexity={input.complexity}
          uncertainty={input.uncertainty} onChange={(effort) => setInput({ ...input, ...effort })} />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={input.milestone}
            onChange={(event) =>
              setInput({ ...input, milestone: event.target.checked })
            }
          />
          {t("hand.milestone")}
        </label>
        <TaskRecurrenceFields
          value={input.recurrence}
          onChange={(recurrence) => setInput({ ...input, recurrence })}
        />
        <Button
          disabled={!input.title.trim()}
          onClick={() => {
            onSave(input);
            onClose();
          }}
        >
          {t(initial ? "common.save" : "common.add")}
        </Button>
      </div>
    </Dialog>
  );
}

export function RetrieveTaskDialog({
  open,
  tasks,
  projectName,
  existingIds,
  onClose,
  onChoose,
}: {
  open: boolean;
  tasks: TaskRecord[];
  projectName: (id?: string) => string;
  existingIds: string[];
  onClose: () => void;
  onChoose: (task: TaskRecord) => void;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const results = useMemo(
    () =>
      tasks.filter(
        (task) =>
          !existingIds.includes(task.id) &&
          `${task.title} ${projectName(task.projectId)}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [existingIds, projectName, query, tasks],
  );
  return (
    <Dialog
      open={open}
      title={t("me.dailyRetrieve")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <Input
        autoFocus
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("me.dailySearchPlaceholder")}
      />
      <div className="mt-4 grid max-h-96 gap-2 overflow-y-auto">
        {results.map((task) => (
          <button
            key={task.id}
            className="rounded-xl border border-zinc-200 p-3 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            onClick={() => onChoose(task)}
          >
            <p className="text-sm font-medium">{task.title}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {projectName(task.projectId) || t("me.independentTask")}
            </p>
          </button>
        ))}
        {!results.length && <EmptyState title={t("common.noData")} />}
      </div>
    </Dialog>
  );
}
