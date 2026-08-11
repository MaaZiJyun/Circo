"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  Field,
  Input,
  Select,
  Textarea,
} from "@/shared/components/ui";
import { typeLabels } from "@/shared/i18n/domain-labels";
import { useI18n } from "@/shared/i18n/i18n-context";
import { addDays, today } from "@/shared/model/factories";
import { parseTags } from "@/shared/model/tags";
import type {
  LogInput,
  ProjectInput,
  TaskInput,
} from "../view-models/use-hand-view-model";

export function ProjectDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (input: ProjectInput) => void;
}) {
  const { t } = useI18n();
  const [input, setInput] = useState<ProjectInput>({
    name: "",
    purpose: "",
    expected: "",
    startDate: today(),
    endDate: addDays(new Date(), 30),
    tags: [],
  });
  const [tagText, setTagText] = useState("");
  const submit = () => {
    if (!input.name.trim()) return;
    onSave({ ...input, tags: parseTags(tagText) });
    onClose();
    setInput({ ...input, name: "", purpose: "", expected: "" });
    setTagText("");
  };
  return (
    <Dialog
      open={open}
      title={t("hand.newProject")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <div className="grid gap-4">
        <Field label={t("common.title")}>
          <Input
            value={input.name}
            onChange={(event) =>
              setInput({ ...input, name: event.target.value })
            }
            autoFocus
          />
        </Field>
        <Field label={t("hand.purpose")}>
          <Textarea
            value={input.purpose}
            onChange={(event) =>
              setInput({ ...input, purpose: event.target.value })
            }
          />
        </Field>
        <Field label={t("hand.expected")}>
          <Textarea
            value={input.expected}
            onChange={(event) =>
              setInput({ ...input, expected: event.target.value })
            }
          />
        </Field>
        <Field label={t("common.tags")}>
          <Input
            value={tagText}
            onChange={(event) => setTagText(event.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("hand.startDate")}>
            <Input
              type="date"
              value={input.startDate}
              onChange={(event) =>
                setInput({ ...input, startDate: event.target.value })
              }
            />
          </Field>
          <Field label={t("hand.endDate")}>
            <Input
              type="date"
              value={input.endDate}
              onChange={(event) =>
                setInput({ ...input, endDate: event.target.value })
              }
            />
          </Field>
        </div>
        <Button onClick={submit}>{t("common.save")}</Button>
      </div>
    </Dialog>
  );
}

export function TaskDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (input: TaskInput) => void;
}) {
  const { t } = useI18n();
  const [input, setInput] = useState<TaskInput>({
    title: "",
    dueDate: addDays(new Date(), 7),
    estimatedMinutes: 60,
    milestone: false,
  });
  const submit = () => {
    if (!input.title.trim()) return;
    onSave(input);
    onClose();
    setInput({ ...input, title: "" });
  };
  return (
    <Dialog
      open={open}
      title={t("hand.newTask")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <div className="grid gap-4">
        <Field label={t("hand.taskTitle")}>
          <Input
            value={input.title}
            onChange={(event) =>
              setInput({ ...input, title: event.target.value })
            }
            autoFocus
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("me.due")}>
            <Input
              type="date"
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
        <Button onClick={submit}>{t("common.save")}</Button>
      </div>
    </Dialog>
  );
}

export function LogDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (input: LogInput) => void;
}) {
  const { t } = useI18n();
  const [input, setInput] = useState<LogInput>({
    type: "progress",
    content: "",
    nextStep: "",
    tags: [],
  });
  const [tagText, setTagText] = useState("");
  const submit = () => {
    if (!input.content.trim()) return;
    onSave({ ...input, tags: parseTags(tagText) });
    onClose();
    setInput({ ...input, content: "", nextStep: "" });
    setTagText("");
  };
  return (
    <Dialog
      open={open}
      title={t("hand.newLog")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <div className="grid gap-4">
        <Field label={t("hand.logType")}>
          <Select
            value={input.type}
            onChange={(event) =>
              setInput({
                ...input,
                type: event.target.value as LogInput["type"],
              })
            }
          >
            {["progress", "decision", "problem", "conclusion"].map((item) => (
              <option key={item} value={item}>
                {t(typeLabels[item])}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("common.content")}>
          <Textarea
            value={input.content}
            onChange={(event) =>
              setInput({ ...input, content: event.target.value })
            }
            autoFocus
          />
        </Field>
        <Field label={t("hand.nextStep")}>
          <Textarea
            value={input.nextStep}
            onChange={(event) =>
              setInput({ ...input, nextStep: event.target.value })
            }
          />
        </Field>
        <Field label={t("common.tags")}>
          <Input
            value={tagText}
            onChange={(event) => setTagText(event.target.value)}
          />
        </Field>
        <Button onClick={submit}>{t("common.save")}</Button>
      </div>
    </Dialog>
  );
}
