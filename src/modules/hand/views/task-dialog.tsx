"use client";

import { useState } from "react";
import { TaskRecurrenceFields } from "@/shared/components/task-recurrence-fields";
import { TaskImportanceFields } from "@/shared/components/task-importance-fields";
import { TaskUrgencyFields } from "@/shared/components/task-urgency-fields";
import { TaskEffortFields } from "@/shared/components/task-effort-fields";
import { Button, Dialog, Field, Input, Select, Switch, Tabs, Textarea } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { ActivityRecord, ActivityType, ProjectRecord } from "@/shared/model/entities";
import {
  estimateMinutes,
  formatLocalDateTime,
  parseLocalDateTime,
} from "@/shared/model/factories";
import { normalizeTaskImportance, taskImportance } from "@/shared/model/task-importance";
import { preprocessTask } from "@/shared/model/task-preprocessor";
import { defaultTaskUrgency } from "@/shared/model/task-urgency";
import { defaultTaskEffort } from "@/shared/model/task-effort";
import { useStore } from "@/shared/view-models/store-context";
import type { ActivityInput } from "../view-models/use-hand-view-model";

export function TaskDialog({
  open,
  edit = false,
  initial,
  defaultImportance = 50,
  taskId,
  parentId,
  initialStartDate,
  projects,
  dependencyActivities,
  initialProjectId,
  title,
  onClose,
  onSave,
}: {
  open: boolean;
  edit?: boolean;
  initial?: ActivityInput;
  defaultImportance?: number;
  taskId?: string;
  parentId?: string;
  initialStartDate?: string;
  projects?: ProjectRecord[];
  dependencyActivities?: ActivityRecord[];
  initialProjectId?: string;
  title?: string;
  onClose: () => void;
  onSave: (input: ActivityInput, projectId?: string) => void;
}) {
  const { t } = useI18n();
  const { state } = useStore();
  const createDefaultInput = () => {
    const current = parseLocalDateTime(initialStartDate ?? "");
    const defaultStart = Number.isFinite(current) ? current : Date.now();
    const defaultStartDate = formatLocalDateTime(defaultStart);
    const defaultDueDate = formatLocalDateTime(defaultStart + 60 * 60 * 1000);
    return {
      title: "",
      description: "",
      startDate: defaultStartDate,
      dueDate: defaultDueDate,
      estimatedMinutes: 60,
      expectedOutput: "",
      milestone: false,
      ...normalizeTaskImportance({}, defaultImportance),
      ...defaultTaskUrgency,
      ...defaultTaskEffort,
      recurrence: null,
      activityType: "task",
      parentId,
    } satisfies ActivityInput;
  };
  const [projectId, setProjectId] = useState(initialProjectId ?? "");
  const [input, setInput] = useState<ActivityInput>(
    () => initial ?? createDefaultInput(),
  );
  const [showMore, setShowMore] = useState(false);
  const updateSchedule = (field: "startDate" | "dueDate", value: string) => {
    setInput((current) => {
      if (field === "startDate") {
        const start = parseLocalDateTime(value);
        if (!Number.isFinite(start)) return { ...current, startDate: value };
        return {
          ...current,
          startDate: value,
          dueDate: formatLocalDateTime(
            start + current.estimatedMinutes * 60 * 1000,
          ),
        };
      }
      const start = parseLocalDateTime(current.startDate);
      const due = parseLocalDateTime(value);
      return {
        ...current,
        dueDate: value,
        estimatedMinutes:
          Number.isFinite(start) && Number.isFinite(due)
            ? estimateMinutes(current.startDate, value)
            : current.estimatedMinutes,
      };
    });
  };
  const updateDuration = (value: string) => {
    setInput((current) => {
      const hours = Math.max(0, Number(value) || 0);
      const estimatedMinutes = Math.round(hours * 60);
      const start = parseLocalDateTime(current.startDate);
      return {
        ...current,
        estimatedMinutes,
        dueDate: Number.isFinite(start)
          ? formatLocalDateTime(start + estimatedMinutes * 60 * 1000)
          : current.dueDate,
      };
    });
  };
  const preprocessTitle = () => {
    if (edit || !state || !input.title.trim()) return;
    const values = preprocessTask(
      input.title,
      state.profile.taskPreprocessingRules,
    );
    setInput((current) => {
      const start = parseLocalDateTime(current.startDate);
      return {
        ...current,
        description: values.description,
        estimatedMinutes: values.estimatedMinutes,
        dueDate: Number.isFinite(start)
          ? formatLocalDateTime(
              start + values.estimatedMinutes * 60 * 1000,
            )
          : current.dueDate,
        expectedOutput: values.expectedOutput,
        impact: values.impact,
        goal: values.goal,
        risk: values.risk,
        value: values.value,
        importance: taskImportance(values),
        delayLoss: values.delayLoss,
        complexity: values.complexity,
        uncertainty: values.uncertainty,
      };
    });
  };
  const submit = () => {
    if (!input.title.trim()) return;
    onSave({ ...input, parentId: input.parentId }, projectId || undefined);
    onClose();
    setInput(createDefaultInput());
  };
  return (
    <Dialog
      open={open}
      title={title ?? t(edit ? "hand.editTask" : "hand.newTask")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <div className="grid gap-4">
        <Field label={t("hand.taskTitle")}>
          <Input
            autoFocus
            value={input.title}
            onChange={(event) =>
              setInput({ ...input, title: event.target.value })
            }
            onBlur={preprocessTitle}
          />
        </Field>
        {projects && (
          <Field label={t("hand.targetProject")}>
            <Select
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
            >
              <option value="">{t("hand.noProject")}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label={t("hand.activityType")}>
          <Tabs
            value={input.activityType ?? "task"}
            onChange={(activityType) => setInput({ ...input, activityType })}
            fullWidth
            items={(["task", "event", "routine"] as ActivityType[]).map((type) => ({
              value: type,
              label: t(`activity.${type}` as `activity.${ActivityType}`),
            }))}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("hand.startDate")}>
            <Input
              type="datetime-local"
              value={input.startDate}
              onChange={(event) => updateSchedule("startDate", event.target.value)}
            />
          </Field>
          <Field label={t("me.due")}>
            <Input
              type="datetime-local"
              value={input.dueDate}
              onChange={(event) => updateSchedule("dueDate", event.target.value)}
            />
          </Field>
        </div>
        <Field label={t("me.taskEstimateHours")}>
          <Input
            type="number"
            min="0"
            step="0.25"
            value={input.estimatedMinutes / 60}
            onChange={(event) => updateDuration(event.target.value)}
          />
        </Field>
        <Field label={t("hand.expectedOutput")}>
          <Textarea
            value={input.expectedOutput}
            onChange={(event) =>
              setInput({ ...input, expectedOutput: event.target.value })
            }
          />
        </Field>
        <Button variant="secondary" onClick={() => setShowMore((value) => !value)}>
          {showMore ? t("hand.collapseMore") : t("hand.more")}
        </Button>
        {showMore && (
          <div className="grid gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={input.milestone}
                onChange={(checked) => setInput({ ...input, milestone: checked })}
              />
              {t("hand.milestone")}
            </label>
            <TaskImportanceFields
              value={input}
              onChange={(dimensions) =>
                setInput({ ...input, ...dimensions, importance: taskImportance(dimensions) })
              }
            />
            <TaskUrgencyFields taskId={taskId} deadline={input.dueDate} delayLoss={input.delayLoss}
              dependencyActivities={dependencyActivities}
              dependencyIds={input.dependencyIds} onChange={(urgency) => setInput({ ...input, ...urgency })} />
            <TaskEffortFields estimatedMinutes={input.estimatedMinutes} complexity={input.complexity}
              uncertainty={input.uncertainty} onChange={(effort) => setInput({ ...input, ...effort })} />
            <TaskRecurrenceFields
              value={input.recurrence}
              onChange={(recurrence) => setInput({ ...input, recurrence })}
            />
          </div>
        )}
        <Button onClick={submit}>{t("common.save")}</Button>
      </div>
    </Dialog>
  );
}
