"use client";

import { useState } from "react";
import { TaskRecurrenceFields } from "@/shared/components/task-recurrence-fields";
import { Button, Dialog, Field, Input, Textarea } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import { addDays } from "@/shared/model/factories";
import type { TaskInput } from "../view-models/use-hand-view-model";

export function TaskDialog({
  open,
  edit = false,
  initial,
  defaultImportance = 50,
  onClose,
  onSave,
}: {
  open: boolean;
  edit?: boolean;
  initial?: TaskInput;
  defaultImportance?: number;
  onClose: () => void;
  onSave: (input: TaskInput) => void;
}) {
  const { t } = useI18n();
  const [input, setInput] = useState<TaskInput>(
    initial ?? {
      title: "",
      description: "",
      dueDate: `${addDays(new Date(), 7)}T23:59`,
      estimatedMinutes: 60,
      expectedOutput: "",
      milestone: false,
      importance: defaultImportance,
      recurrence: null,
    },
  );
  const submit = () => {
    if (!input.title.trim()) return;
    onSave(input);
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
        <Field label={t("hand.taskDescription")}>
          <Textarea
            value={input.description}
            onChange={(event) =>
              setInput({ ...input, description: event.target.value })
            }
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("me.due")}>
            <Input
              type="datetime-local"
              value={input.dueDate}
              onChange={(event) =>
                setInput({ ...input, dueDate: event.target.value })
              }
            />
          </Field>
          <Field label={t("hand.estimate")}>
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
        <Field label={t("hand.expectedOutput")}>
          <Textarea
            value={input.expectedOutput}
            onChange={(event) =>
              setInput({ ...input, expectedOutput: event.target.value })
            }
          />
        </Field>
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
        <Field label={t("me.taskImportance")}>
          <Input
            type="number"
            min="0"
            max="100"
            value={input.importance}
            onChange={(event) =>
              setInput({
                ...input,
                importance: Math.min(
                  100,
                  Math.max(0, Number(event.target.value)),
                ),
              })
            }
          />
        </Field>
        <TaskRecurrenceFields
          value={input.recurrence}
          onChange={(recurrence) => setInput({ ...input, recurrence })}
        />
        <Button onClick={submit}>{t("common.save")}</Button>
      </div>
    </Dialog>
  );
}
