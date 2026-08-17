"use client";

import { useState } from "react";
import { TaskRecurrenceFields } from "@/shared/components/task-recurrence-fields";
import { TaskImportanceFields } from "@/shared/components/task-importance-fields";
import { TaskUrgencyFields } from "@/shared/components/task-urgency-fields";
import { TaskEffortFields } from "@/shared/components/task-effort-fields";
import { Button, Dialog, Field, Input, Select, Switch, Textarea } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { ProjectRecord } from "@/shared/model/entities";
import { addDays, estimateMinutes, startDateFromDue } from "@/shared/model/factories";
import { normalizeTaskImportance, taskImportance } from "@/shared/model/task-importance";
import { defaultTaskUrgency } from "@/shared/model/task-urgency";
import { defaultTaskEffort } from "@/shared/model/task-effort";
import type { TaskInput } from "../view-models/use-hand-view-model";

export function TaskDialog({
  open,
  edit = false,
  initial,
  defaultImportance = 50,
  taskId,
  parentId,
  projects,
  initialProjectId,
  onClose,
  onSave,
}: {
  open: boolean;
  edit?: boolean;
  initial?: TaskInput;
  defaultImportance?: number;
  taskId?: string;
  parentId?: string;
  projects?: ProjectRecord[];
  initialProjectId?: string;
  onClose: () => void;
  onSave: (input: TaskInput, projectId?: string) => void;
}) {
  const { t } = useI18n();
  const defaultDueDate = `${addDays(new Date(), 7)}T23:59`;
  const [projectId, setProjectId] = useState(initialProjectId ?? "");
  const [input, setInput] = useState<TaskInput>(
    initial ?? {
      title: "",
      description: "",
      startDate: startDateFromDue(defaultDueDate, 1440),
      dueDate: defaultDueDate,
      expectedOutput: "",
      milestone: false,
      ...normalizeTaskImportance({}, defaultImportance),
      ...defaultTaskUrgency,
      ...defaultTaskEffort,
      recurrence: null,
      parentId,
    },
  );
  const derivedEstimate = estimateMinutes(input.startDate, input.dueDate);
  const submit = () => {
    if (!input.title.trim()) return;
    onSave({ ...input, parentId: input.parentId }, projectId || undefined);
    onClose();
    setInput({ ...input, title: "" });
  };
  return (
    <Dialog
      open={open}
      title={t(edit ? "hand.editTask" : "hand.newTask")}
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
        <Field label={t("hand.taskDescription")}>
          <Textarea
            value={input.description}
            onChange={(event) =>
              setInput({ ...input, description: event.target.value })
            }
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("hand.startDate")}>
            <Input
              type="datetime-local"
              value={input.startDate}
              onChange={(event) =>
                setInput({ ...input, startDate: event.target.value })
              }
            />
          </Field>
          <Field label={t("me.due")}>
            <Input
              type="datetime-local"
              value={input.dueDate}
              onChange={(event) =>
                setInput({ ...input, dueDate: event.target.value })
              }
            />
          </Field>
        </div>
        <Field label={t("hand.expectedOutput")}>
          <Textarea
            value={input.expectedOutput}
            onChange={(event) =>
              setInput({ ...input, expectedOutput: event.target.value })
            }
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={input.milestone}
            onChange={(checked) =>
              setInput({ ...input, milestone: checked })
            }
          />
          {t("hand.milestone")}
        </label>
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
        <TaskUrgencyFields taskId={taskId} deadline={input.dueDate} delayLoss={input.delayLoss}
          dependencyIds={input.dependencyIds} onChange={(urgency) => setInput({ ...input, ...urgency })} />
        <TaskEffortFields estimatedMinutes={derivedEstimate} complexity={input.complexity}
          uncertainty={input.uncertainty} onChange={(effort) => setInput({ ...input, ...effort })} />
        <TaskRecurrenceFields
          value={input.recurrence}
          onChange={(recurrence) => setInput({ ...input, recurrence })}
        />
        <Button onClick={submit}>{t("common.save")}</Button>
      </div>
    </Dialog>
  );
}
