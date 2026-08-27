"use client";

import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

import {
  Button,
  Checkbox,
  Field,
  IconButton,
  Input,
  Select,
  Switch,
  Textarea,
} from "@/shared/components/ui";
import { statusLabels } from "@/shared/i18n/domain-labels";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { ActivityRecord } from "@/shared/model/entities";
import {
  estimateMinutes,
  formatLocalDateTime,
  parseLocalDateTime,
} from "@/shared/model/factories";
import {
  clamp,
  createsDependencyCycle,
  HOUR,
  isTaskDescendant,
} from "../model/gantt-layout";
import { formatDuration, formatTimingDelta, taskTiming } from "../model/task-timing";
import type { GanttTaskPatch } from "../view-models/use-project-task-actions";

const TASK_STATUSES: ActivityRecord["status"][] = [
  "todo",
  "doing",
  "done",
  "overdue",
];

export function TaskGanttInspector({
  task,
  activities,
  onClose,
  onSave,
}: {
  task: ActivityRecord;
  activities: ActivityRecord[];
  onClose: () => void;
  onSave: (patch: GanttTaskPatch) => void;
}) {
  const { t } = useI18n();
  const timing = taskTiming(task);
  const [draft, setDraft] = useState(() => ({
    title: task.title,
    status: task.status,
    progress:
      task.status === "done"
        ? 100
        : Math.round(
            clamp(
              task.estimatedMinutes
                ? task.actualMinutes / task.estimatedMinutes
                : 0,
              0,
              1,
            ) * 100,
          ),
    startDate: task.startDate,
    dueDate: task.dueDate,
    dependencyIds: task.dependencyIds,
    milestone: task.milestone,
    expectedOutput: task.expectedOutput,
    description: task.description,
  }));

  const updateStart = (startDate: string) => {
    const oldStart = parseLocalDateTime(draft.startDate);
    const oldEnd = parseLocalDateTime(draft.dueDate);
    const nextStart = parseLocalDateTime(startDate);
    setDraft((current) => ({
      ...current,
      startDate,
      dueDate:
        Number.isFinite(nextStart) &&
        Number.isFinite(oldStart) &&
        Number.isFinite(oldEnd)
          ? formatLocalDateTime(nextStart + Math.max(HOUR, oldEnd - oldStart))
          : current.dueDate,
    }));
  };

  const submit = () => {
    const estimatedMinutes = Math.max(
      1,
      estimateMinutes(draft.startDate, draft.dueDate),
    );
    onSave({
      title: draft.title.trim() || task.title,
      status: draft.status,
      startDate: draft.startDate,
      dueDate: draft.dueDate,
      estimatedMinutes,
      actualMinutes: Math.round((estimatedMinutes * draft.progress) / 100),
      dependencyIds: draft.dependencyIds,
      milestone: draft.milestone,
      expectedOutput: draft.expectedOutput,
      description: draft.description,
    });
  };

  return (
    <aside className="absolute inset-y-0 right-0 z-[70] w-full max-w-sm overflow-y-auto border-l border-zinc-200 bg-white shadow-[-12px_0_30px_rgba(0,0,0,0.08)] dark:border-zinc-800 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white/95 px-5 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <h3 className="font-semibold">{t("hand.ganttInspector")}</h3>
        <IconButton label={t("common.close")} onClick={onClose}>
          <XMarkIcon className="size-5" />
        </IconButton>
      </header>
      <div className="grid gap-4 p-5">
        <Field label={t("common.title")}>
          <Input
            value={draft.title}
            onChange={(event) =>
              setDraft({ ...draft, title: event.target.value })
            }
          />
        </Field>
        <Field label={t("common.status")}>
          <Select
            value={draft.status}
            onChange={(event) => {
              const status = event.target.value as ActivityRecord["status"];
              setDraft({
                ...draft,
                status,
                progress: status === "done" ? 100 : draft.progress,
              });
            }}
          >
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(statusLabels[status])}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={`${t("common.progress")} · ${draft.progress}%`}>
          <div className="relative flex h-7 items-center">
            <div className="absolute inset-x-0 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-zinc-950 transition-[width] dark:bg-zinc-50"
                style={{ width: `${draft.progress}%` }}
              />
            </div>
            <input
              className="relative z-10 h-7 w-full cursor-pointer appearance-none bg-transparent outline-none disabled:cursor-default [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-zinc-950 [&::-moz-range-thumb]:shadow-sm dark:[&::-moz-range-thumb]:border-zinc-950 dark:[&::-moz-range-thumb]:bg-white [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:mt-[-5px] [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-zinc-950 [&::-webkit-slider-thumb]:shadow-sm dark:[&::-webkit-slider-thumb]:border-zinc-950 dark:[&::-webkit-slider-thumb]:bg-white"
              type="range"
              min="0"
              max="100"
              step="5"
              value={draft.progress}
              disabled={draft.status === "done"}
              onChange={(event) =>
                setDraft({ ...draft, progress: Number(event.target.value) })
              }
            />
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("hand.startDate")}>
            <Input
              type="datetime-local"
              value={draft.startDate}
              onChange={(event) => updateStart(event.target.value)}
            />
          </Field>
          <Field label={t("hand.endDate")}>
            <Input
              type="datetime-local"
              value={draft.dueDate}
              onChange={(event) =>
                setDraft({ ...draft, dueDate: event.target.value })
              }
            />
          </Field>
        </div>
        <div className="grid gap-2 rounded-lg bg-zinc-50 p-3 text-xs dark:bg-zinc-900/70">
          <div className="flex justify-between gap-3">
            <span className="text-zinc-500">{t("hand.ganttExpectedDuration")}</span>
            <span className="font-medium">{formatDuration(task.estimatedMinutes)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-zinc-500">{t("hand.ganttActualStart")}</span>
            <span className="font-medium">{task.actualStartedAt ?? t("hand.ganttNotRecorded")}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-zinc-500">{t("hand.ganttActualEnd")}</span>
            <span className="font-medium">{task.completedAt ?? t("hand.ganttNotRecorded")}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-zinc-500">{t("hand.ganttStartDelta")}</span>
            <span className={timing.startDeltaMinutes && timing.startDeltaMinutes > 0 ? "font-medium text-red-600" : "font-medium text-emerald-600"}>
              {formatTimingDelta(timing.startDeltaMinutes)}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-zinc-500">{t("hand.ganttEndDelta")}</span>
            <span className={timing.endDeltaMinutes && timing.endDeltaMinutes > 0 ? "font-medium text-red-600" : "font-medium text-emerald-600"}>
              {formatTimingDelta(timing.endDeltaMinutes)}
            </span>
          </div>
        </div>
        <Field label={t("hand.dependencies")}>
          <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
            {activities
              .filter(
                (candidate) =>
                  candidate.id !== task.id &&
                  candidate.projectId === task.projectId &&
                  !isTaskDescendant(activities, candidate.id, task.id),
              )
              .map((candidate) => {
                const checked = draft.dependencyIds.includes(candidate.id);
                return (
                  <label
                    key={candidate.id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    <Checkbox
                      checked={checked}
                      disabled={
                        !checked &&
                        createsDependencyCycle(activities, candidate.id, task.id)
                      }
                      onChange={(next) =>
                        setDraft({
                          ...draft,
                          dependencyIds: next
                            ? [...draft.dependencyIds, candidate.id]
                            : draft.dependencyIds.filter(
                                (id) => id !== candidate.id,
                              ),
                        })
                      }
                    />
                    <span className="truncate">{candidate.title}</span>
                  </label>
                );
              })}
          </div>
        </Field>
        <label className="flex items-center justify-between text-sm font-medium">
          {t("hand.ganttMilestone")}
          <Switch
            checked={draft.milestone}
            onChange={(milestone) => setDraft({ ...draft, milestone })}
          />
        </label>
        <Field label={t("hand.ganttOutcome")}>
          <Textarea
            value={draft.expectedOutput}
            onChange={(event) =>
              setDraft({ ...draft, expectedOutput: event.target.value })
            }
          />
        </Field>
        <Field label={t("hand.ganttNotes")}>
          <Textarea
            value={draft.description}
            onChange={(event) =>
              setDraft({ ...draft, description: event.target.value })
            }
          />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit}>{t("common.save")}</Button>
        </div>
      </div>
    </aside>
  );
}
