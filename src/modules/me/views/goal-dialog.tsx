"use client";

import { useState } from "react";
import { Button, Dialog, Field, Input } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { GoalInput } from "../view-models/use-me-view-model";

export function GoalDialog({
  open,
  onClose,
  onSave,
  today,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (input: GoalInput) => void;
  today: string;
}) {
  const { t } = useI18n();
  const [input, setInput] = useState<GoalInput>({
    title: "",
    target: 10,
    current: 0,
    unit: t("common.hours"),
    dueDate: today,
  });
  const submit = () => {
    if (!input.title.trim()) return;
    onSave(input);
    onClose();
    setInput({ ...input, title: "", current: 0 });
  };
  return (
    <Dialog
      open={open}
      title={t("me.newGoal")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <div className="grid gap-4">
        <Field label={t("me.goalTitle")}>
          <Input
            value={input.title}
            onChange={(event) =>
              setInput({ ...input, title: event.target.value })
            }
            autoFocus
          />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label={t("me.target")}>
            <Input
              type="number"
              min="1"
              value={input.target}
              onChange={(event) =>
                setInput({ ...input, target: Number(event.target.value) })
              }
            />
          </Field>
          <Field label={t("me.current")}>
            <Input
              type="number"
              min="0"
              value={input.current}
              onChange={(event) =>
                setInput({ ...input, current: Number(event.target.value) })
              }
            />
          </Field>
          <Field label={t("me.unit")}>
            <Input
              value={input.unit}
              onChange={(event) =>
                setInput({ ...input, unit: event.target.value })
              }
            />
          </Field>
        </div>
        <Field label={t("me.due")}>
          <Input
            type="date"
            value={input.dueDate}
            onChange={(event) =>
              setInput({ ...input, dueDate: event.target.value })
            }
          />
        </Field>
        <Button onClick={submit}>{t("common.save")}</Button>
      </div>
    </Dialog>
  );
}
