"use client";
import { useState } from "react";
import { Button, Dialog, Field, Input, Select, Textarea } from "@/shared/components/ui";
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
  initial,
  edit = false,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (input: ProjectInput) => void;
  initial?: ProjectInput;
  edit?: boolean;
}) {
  const { t } = useI18n();
  const [input, setInput] = useState<ProjectInput>(
    initial ?? {
      name: "",
      purpose: "",
      expected: "",
      startDate: today(),
      endDate: addDays(new Date(), 30),
      tags: [],
      score: 50,
    },
  );
  const [tagText, setTagText] = useState(initial?.tags.join(", ") ?? "");
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
      title={edit ? t("hand.editProject") : t("hand.newProject")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <div className="grid gap-4">
        <Field label={t("common.title")}>
          <Input value={input.name} onChange={(event) => setInput({ ...input, name: event.target.value })} autoFocus />
        </Field>
        <Field label={t("hand.purpose")}>
          <Textarea value={input.purpose} onChange={(event) => setInput({ ...input, purpose: event.target.value })} />
        </Field>
        <Field label={t("hand.expected")}>
          <Textarea value={input.expected} onChange={(event) => setInput({ ...input, expected: event.target.value })} />
        </Field>
        <Field label={t("common.tags")}>
          <Input value={tagText} onChange={(event) => setTagText(event.target.value)} />
        </Field>
        <Field label={t("hand.projectScore")}>
          <Input
            type="number"
            min="0"
            max="100"
            value={input.score}
            onChange={(event) =>
              setInput({
                ...input,
                score: Math.min(100, Math.max(0, Number(event.target.value))),
              })
            }
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
  edit = false,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  edit?: boolean;
  initial?: TaskInput;
  onClose: () => void;
  onSave: (input: TaskInput) => void;
}) {
  const { t } = useI18n();
  const [input, setInput] = useState<TaskInput>(initial ?? {
    title: "",
    description: "",
    dueDate: `${addDays(new Date(), 7)}T23:59`,
    estimatedMinutes: 60,
    expectedOutput: "",
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
      title={t(edit ? "hand.editTask" : "hand.newTask")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <div className="grid gap-4">
        <Field label={t("hand.taskTitle")}>
          <Input value={input.title} onChange={(event) => setInput({ ...input, title: event.target.value })} autoFocus />
        </Field>
        <Field label={t("hand.taskDescription")}>
          <Textarea value={input.description} onChange={(event) => setInput({ ...input, description: event.target.value })} />
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
  onSave: (input: LogInput) => Promise<void>;
}) {
  const { t } = useI18n();
  const [input, setInput] = useState<LogInput>({
    type: "progress",
    period: "day",
    content: "",
    nextStep: "",
    tags: [],
  });
  const [tagText, setTagText] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!input.content.trim()) return;
    setSaving(true);
    try {
      await onSave({ ...input, tags: parseTags(tagText) });
      onClose();
      setInput({ ...input, content: "", nextStep: "" });
      setTagText("");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog
      open={open}
      title={t("hand.newLog")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <div className="grid gap-4">
        <Field label={t("hand.logPeriod")}>
          <Select
            value={input.period}
            onChange={(event) =>
              setInput({
                ...input,
                period: event.target.value as LogInput["period"],
              })
            }
          >
            {(["day", "week", "month", "year"] as const).map((period) => (
              <option key={period} value={period}>
                {t(`hand.logPeriod.${period}`)}
              </option>
            ))}
          </Select>
        </Field>
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
        <Button disabled={saving} onClick={() => void submit()}>
          {saving ? t("common.saving") : t("common.save")}
        </Button>
      </div>
    </Dialog>
  );
}
