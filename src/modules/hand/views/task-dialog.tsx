"use client";

import { useState } from "react";
import { TaskRecurrenceFields } from "@/shared/components/task-recurrence-fields";
import { TaskImportanceFields } from "@/shared/components/task-importance-fields";
import { TaskUrgencyFields } from "@/shared/components/task-urgency-fields";
import { TaskEffortFields } from "@/shared/components/task-effort-fields";
import {
  ActivityConditionChecklist,
} from "@/shared/components/activity-condition-checklist";
import {
  ActivityFocusEditor,
  validActivityFocus,
} from "@/shared/components/activity-focus-editor";
import type { ActivityConditionDraft } from "@/shared/model/activity-conditions";
import { Button, Dialog, Field, Input, Select, Switch, Tabs } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { ActivityRecord, ActivityType, FocusRecord, ProjectRecord } from "@/shared/model/entities";
import {
  estimateMinutes,
  createId,
  formatLocalDateTime,
  parseLocalDateTime,
} from "@/shared/model/factories";
import { normalizeTaskImportance, taskImportance } from "@/shared/model/task-importance";
import { preprocessTask } from "@/shared/model/task-preprocessor";
import { defaultTaskUrgency } from "@/shared/model/task-urgency";
import { defaultTaskEffort } from "@/shared/model/task-effort";
import { replaceActivityFocus } from "@/shared/model/focus";
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
  initialConditions,
  readOnly = false,
  immutable = false,
  onConditionToggle,
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
  initialConditions?: ActivityConditionDraft[];
  readOnly?: boolean;
  immutable?: boolean;
  onConditionToggle?: (id: string, satisfied: boolean) => void;
  initialProjectId?: string;
  title?: string;
  onClose: () => void;
  onSave: (
    input: ActivityInput,
    projectId?: string,
    conditions?: ActivityConditionDraft[],
  ) => void;
}) {
  const { t } = useI18n();
  const { state, mutate } = useStore();
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
  const [input, setInput] = useState<ActivityInput>(() => {
    const value = initial ?? createDefaultInput();
    const derivedMinutes = estimateMinutes(value.startDate, value.dueDate);
    return {
      ...value,
      estimatedMinutes: Number.isFinite(derivedMinutes)
        ? derivedMinutes
        : value.estimatedMinutes,
    };
  });
  const [conditions, setConditions] = useState<ActivityConditionDraft[]>(
    () => initialConditions ?? [],
  );
  const [focusRecords, setFocusRecords] = useState<FocusRecord[]>(() =>
    taskId
      ? (state?.focus ?? []).filter(
          (record) => record.focusOn === taskId && !record.deletedAt,
        )
      : [],
  );
  const [editingMode, setEditingMode] = useState(!readOnly && !immutable);
  const [showMore, setShowMore] = useState(false);
  const canEdit = !immutable && (!readOnly || editingMode);
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
    if (!canEdit || !input.title.trim() || !validActivityFocus(focusRecords)) return;
    const derivedMinutes = estimateMinutes(input.startDate, input.dueDate);
    onSave(
      {
        ...input,
        parentId: input.parentId,
        estimatedMinutes: Number.isFinite(derivedMinutes)
          ? derivedMinutes
          : input.estimatedMinutes,
      },
      projectId || undefined,
      conditions,
    );
    if (taskId) mutate((current) => replaceActivityFocus(current, taskId, focusRecords));
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
        {readOnly && !immutable && !editingMode && (
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={() => setEditingMode(true)}>
              {t("common.edit")}
            </Button>
          </div>
        )}
        <fieldset disabled={!canEdit} className="grid gap-4">
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
        </fieldset>
        {edit && taskId && (
          <ActivityFocusEditor
            records={focusRecords}
            editable={canEdit}
            activityId={taskId}
            activityTitle={input.title}
            expectedOutput={input.expectedOutput}
            defaultStartedAt={input.startDate}
            onChange={setFocusRecords}
          />
        )}
        <ActivityConditionChecklist
          conditions={conditions}
          editable={canEdit}
          allowToggle={!immutable && (readOnly || !edit)}
          onChange={(id, condition) =>
            setConditions((current) =>
              current.map((item) =>
                item.id === id ? { ...item, condition } : item,
              ),
            )
          }
          onToggle={(id, satisfied) => {
            setConditions((current) =>
              current.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      satisfiedAt: satisfied ? new Date().toISOString() : undefined,
                    }
                  : item,
              ),
            );
            if (readOnly) onConditionToggle?.(id, satisfied);
          }}
          onAdd={() =>
            setConditions((current) => [
              ...current,
              { id: createId("condition"), activityId: taskId ?? "", condition: "" },
            ])
          }
          onDelete={(id) =>
            setConditions((current) => current.filter((item) => item.id !== id))
          }
        />
        {canEdit && (
          <Button disabled={!input.title.trim() || !validActivityFocus(focusRecords)} onClick={submit}>
            {t("common.save")}
          </Button>
        )}
      </div>
    </Dialog>
  );
}
